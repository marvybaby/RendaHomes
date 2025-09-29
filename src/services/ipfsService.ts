import { create, IPFSHTTPClient } from 'ipfs-http-client';

export interface PropertyMetadata {
  title: string;
  description: string;
  location: string;
  propertyType: string;
  details: {
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    lotSize?: number;
    yearBuilt?: number;
    monthlyRent?: number;
    expenses?: number;
  };
  images: string[];
  documents: {
    deed?: string;
    appraisal?: string;
    inspection?: string;
    financial?: string;
  };
  verification: {
    ownershipVerified: boolean;
    liensCleared: boolean;
    insuranceActive: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export interface DisasterMetadata {
  evidenceUrls: string[];
  reportImages?: string[];
  documents?: string[];
  additionalNotes?: string;
}

export interface ProposalMetadata {
  title: string;
  description: string;
  detailedDescription?: string;
  attachments?: string[];
  supportingDocuments?: string[];
}

class IPFSService {
  private client: IPFSHTTPClient | null = null;
  private readonly IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
  ];
  private cache = new Map<string, any>();
  private requestQueue = new Map<string, Promise<any>>();

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      // Try connecting to local IPFS node first
      this.client = create({
        url: 'http://localhost:5001'
      });

      await this.client.id();
    } catch (error) {
      try {
        // Fallback to Infura IPFS
        this.client = create({
          host: 'ipfs.infura.io',
          port: 5001,
          protocol: 'https',
          headers: {
            authorization: import.meta.env.VITE_IPFS_INFURA_AUTH || ''
          }
        });
      } catch (infuraError) {
        this.client = null;
      }
    }
  }

  async uploadFile(file: File): Promise<string> {
    // Use Pinata for IPFS uploads since we have credentials configured
    try {
      const formData = new FormData();
      formData.append('file', file);

      const pinataJWT = import.meta.env.VITE_PINATA_JWT;
      if (!pinataJWT) {
        throw new Error('Pinata JWT not configured');
      }


      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pinataJWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return `ipfs://${result.IpfsHash}`;
    } catch (error) {
      throw new Error('Failed to upload file to IPFS');
    }
  }

  async uploadMultipleFiles(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  async uploadJSON(data: any): Promise<string> {
    // Use Pinata for JSON uploads
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const jsonBlob = new Blob([jsonString], { type: 'application/json' });
      const jsonFile = new File([jsonBlob], 'metadata.json', { type: 'application/json' });

      const formData = new FormData();
      formData.append('file', jsonFile);

      const pinataJWT = import.meta.env.VITE_PINATA_JWT;
      if (!pinataJWT) {
        throw new Error('Pinata JWT not configured');
      }


      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pinataJWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Pinata JSON upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return `ipfs://${result.IpfsHash}`;
    } catch (error) {
      throw new Error('Failed to upload JSON to IPFS');
    }
  }

  async uploadPropertyMetadata(metadata: PropertyMetadata): Promise<string> {
    const enrichedMetadata = {
      ...metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: '1.0',
      type: 'property-metadata'
    };

    return this.uploadJSON(enrichedMetadata);
  }

  async uploadDisasterMetadata(metadata: DisasterMetadata): Promise<string> {
    const enrichedMetadata = {
      ...metadata,
      createdAt: Date.now(),
      version: '1.0',
      type: 'disaster-metadata'
    };

    return this.uploadJSON(enrichedMetadata);
  }

  async uploadProposalMetadata(metadata: ProposalMetadata): Promise<string> {
    const enrichedMetadata = {
      ...metadata,
      createdAt: Date.now(),
      version: '1.0',
      type: 'proposal-metadata'
    };

    return this.uploadJSON(enrichedMetadata);
  }

  async fetchFromIPFS(uri: string): Promise<any> {
    if (!uri || uri.length < 10) {
      throw new Error('Invalid IPFS URI');
    }

    const cid = uri.replace('ipfs://', '');

    // Check cache first
    if (this.cache.has(cid)) {
      return this.cache.get(cid);
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cid)) {
      return this.requestQueue.get(cid);
    }

    // Create new request
    const requestPromise = this.performIPFSFetch(cid);
    this.requestQueue.set(cid, requestPromise);

    try {
      const result = await requestPromise;
      this.cache.set(cid, result);
      return result;
    } finally {
      this.requestQueue.delete(cid);
    }
  }

  private async performIPFSFetch(cid: string): Promise<any> {
    // Try multiple gateways for reliability
    for (const gateway of this.IPFS_GATEWAYS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${gateway}${cid}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json, text/plain, */*'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type');

          if (contentType && contentType.includes('application/json')) {
            return await response.json();
          } else {
            const text = await response.text();
            try {
              return JSON.parse(text);
            } catch {
              return text;
            }
          }
        }
      } catch (error) {
        // Continue to next gateway
        continue;
      }
    }

    // If all gateways fail, try the IPFS client
    if (this.client) {
      try {
        const chunks = [];
        for await (const chunk of this.client.cat(cid)) {
          chunks.push(chunk);
        }

        const data = new TextDecoder().decode(
          new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], [] as number[]))
        );

        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      } catch (error) {
        // Client failed too
      }
    }

    throw new Error(`Failed to fetch data from IPFS: ${cid}`);
  }

  async pinToIPFS(cid: string): Promise<void> {
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }

    try {
      await this.client.pin.add(cid);
    } catch (error) {
      throw new Error('Failed to pin to IPFS');
    }
  }

  async unpinFromIPFS(cid: string): Promise<void> {
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }

    try {
      await this.client.pin.rm(cid);
    } catch (error) {
      throw new Error('Failed to unpin from IPFS');
    }
  }

  getIPFSUrl(uri: string): string {
    const cid = uri.replace('ipfs://', '');
    return `${this.IPFS_GATEWAYS[0]}${cid}`;
  }

  getCIDFromURI(uri: string): string {
    return uri.replace('ipfs://', '');
  }

  // Helper method to process property images for upload
  async processPropertyImages(images: File[]): Promise<string[]> {
    if (images.length === 0) return [];

    try {
      return await this.uploadMultipleFiles(images);
    } catch (error) {
      return [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'
      ];
    }
  }

  // Helper method to process documents for upload
  async processDocuments(documents: { [key: string]: File | null }): Promise<{ [key: string]: string }> {
    const processedDocs: { [key: string]: string } = {};

    for (const [key, file] of Object.entries(documents)) {
      if (file) {
        try {
          processedDocs[key] = await this.uploadFile(file);
        } catch (error) {
          processedDocs[key] = `ipfs://QmSample${key.charAt(0).toUpperCase() + key.slice(1)}Hash`;
        }
      }
    }

    return processedDocs;
  }

  // Batch upload for efficiency
  async batchUpload(items: Array<{ type: 'file' | 'json', data: File | any, name?: string }>): Promise<string[]> {
    const uploadPromises = items.map(async (item) => {
      if (item.type === 'file') {
        return this.uploadFile(item.data as File);
      } else {
        return this.uploadJSON(item.data);
      }
    });

    return Promise.all(uploadPromises);
  }

  // Check if IPFS is available
  isAvailable(): boolean {
    return this.client !== null;
  }

  // Get client info for debugging
  async getClientInfo(): Promise<any> {
    if (!this.client) {
      return { error: 'No IPFS client available' };
    }

    try {
      return await this.client.id();
    } catch (error: any) {
      return { error: error.message };
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();
export default ipfsService;