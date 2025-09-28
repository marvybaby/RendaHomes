export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface PropertyMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    location: string;
    price: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    propertyType: string;
    yearBuilt?: number;
  };
}

export class PinataService {
  private jwt: string;
  private gateway: string;

  constructor() {
    this.jwt = import.meta.env.VITE_PINATA_JWT || '';
    this.gateway = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

    if (!this.jwt) {
    }
  }

  /**
   * Upload a file to Pinata IPFS
   */
  async uploadFile(file: File, metadata?: { name?: string; description?: string }): Promise<PinataUploadResponse> {
    if (!this.jwt) {
      throw new Error('Pinata JWT token not configured');
    }

    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      const pinataMetadata = {
        name: metadata.name || file.name,
        keyvalues: {
          description: metadata.description || ''
        }
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.jwt}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Pinata upload failed: ${response.status} ${errorData}`);
    }

    return await response.json();
  }

  /**
   * Upload JSON metadata to Pinata IPFS
   */
  async uploadJSON(jsonData: any, filename?: string): Promise<PinataUploadResponse> {
    if (!this.jwt) {
      throw new Error('Pinata JWT token not configured');
    }

    const data = {
      pinataContent: jsonData,
      pinataMetadata: {
        name: filename || 'metadata.json'
      }
    };

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.jwt}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Pinata JSON upload failed: ${response.status} ${errorData}`);
    }

    return await response.json();
  }

  /**
   * Upload property metadata (images + JSON metadata)
   */
  async uploadPropertyMetadata(
    images: File[],
    metadata: Omit<PropertyMetadata, 'image'>
  ): Promise<{ metadataHash: string; imageHashes: string[] }> {
    try {
      // Upload images first
      const imageHashes: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const uploadResult = await this.uploadFile(image, {
          name: `property-image-${i + 1}`,
          description: `Property image ${i + 1} for ${metadata.name}`
        });
        imageHashes.push(uploadResult.IpfsHash);
      }

      // Create complete metadata with image URLs
      const completeMetadata: PropertyMetadata = {
        ...metadata,
        image: imageHashes.length > 0 ? this.getIPFSUrl(imageHashes[0]) : ''
      };

      // Add additional image URLs to attributes if multiple images
      if (imageHashes.length > 1) {
        (completeMetadata as any).images = imageHashes.map(hash => this.getIPFSUrl(hash));
      }

      // Upload metadata JSON
      const metadataResult = await this.uploadJSON(completeMetadata, `${metadata.name}-metadata.json`);

      return {
        metadataHash: metadataResult.IpfsHash,
        imageHashes
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get IPFS URL from hash
   */
  getIPFSUrl(hash: string): string {
    return `${this.gateway}${hash}`;
  }

  /**
   * Fetch content from IPFS
   */
  async fetchFromIPFS(hash: string): Promise<any> {
    const url = this.getIPFSUrl(hash);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  }

  /**
   * Test Pinata connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.jwt) {
        throw new Error('No JWT token configured');
      }

      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.jwt}`
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const pinataService = new PinataService();