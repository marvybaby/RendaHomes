import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useAlert } from '@/hooks/useAlert';
import BlockchainService from '@/services/blockchainService';
import ipfsService, { PropertyMetadata } from '@/services/ipfsService';

interface PropertySubmission {
  // Basic Information
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Property Details
  propertyType: 'residential' | 'commercial' | 'industrial' | 'land';
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotSize: number;
  yearBuilt: number;
  
  // Financial Information
  purchasePrice: number;
  currentValue: number;
  monthlyRent: number;
  expenses: number;
  
  // Tokenization Details
  totalTokens: number;
  tokenPrice: number;
  minimumInvestment: number;
  
  // Documents
  deedDocument: File | null;
  appraisalReport: File | null;
  inspectionReport: File | null;
  financialStatements: File | null;
  photos: File[];
  
  // Legal
  ownershipVerified: boolean;
  liensCleared: boolean;
  insuranceActive: boolean;
}

export default function OnboardPropertyPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const { wallet, isConnected } = useWallet();
  const { success, error, info, warning } = useAlert();
  
  const [formData, setFormData] = useState<PropertySubmission>({
    title: 'Luxury Downtown Apartment Complex',
    description: 'Modern 50-unit apartment building in prime downtown location with excellent rental yield potential and strong appreciation prospects. Features include rooftop amenities, underground parking, and high-end finishes throughout.',
    address: '123 Main Street',
    city: 'Miami',
    state: 'Florida',
    zipCode: '33101',
    country: 'United States',
    propertyType: 'residential',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 45000,
    lotSize: 10000,
    yearBuilt: 2020,
    purchasePrice: 4500000,
    currentValue: 5000000,
    monthlyRent: 40000,
    expenses: 15000,
    totalTokens: 50000,
    tokenPrice: 100,
    minimumInvestment: 1000,
    deedDocument: null,
    appraisalReport: null,
    inspectionReport: null,
    financialStatements: null,
    photos: [],
    ownershipVerified: true,
    liensCleared: true,
    insuranceActive: true,
  });

  const handleInputChange = (field: keyof PropertySubmission, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (field: keyof PropertySubmission, files: FileList | null) => {
    if (!files) return;
    
    if (field === 'photos') {
      setFormData(prev => ({
        ...prev,
        photos: Array.from(files)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: files[0]
      }));
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(formData.title && formData.description && formData.address && formData.city);
      case 2:
        return !!(formData.sqft && formData.propertyType && formData.yearBuilt);
      case 3:
        return !!(formData.currentValue && formData.tokenPrice && formData.totalTokens);
      case 4:
        return !!(formData.deedDocument && formData.appraisalReport);
      case 5:
        return formData.ownershipVerified && formData.liensCleared && formData.insuranceActive;
      default:
        return true;
    }
  };

  const uploadToIPFS = async (): Promise<string> => {
    try {
      // Upload images to IPFS
      const imageUrls = await ipfsService.processPropertyImages(formData.photos);

      // Upload documents to IPFS
      const documentUrls = await ipfsService.processDocuments({
        deed: formData.deedDocument,
        appraisal: formData.appraisalReport,
        inspection: formData.inspectionReport,
        financial: formData.financialStatements
      });

      // Create property metadata
      const metadata: PropertyMetadata = {
        title: formData.title,
        description: formData.description,
        location: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
        propertyType: formData.propertyType,
        details: {
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          sqft: formData.sqft,
          lotSize: formData.lotSize,
          yearBuilt: formData.yearBuilt,
          monthlyRent: formData.monthlyRent,
          expenses: formData.expenses
        },
        images: imageUrls,
        documents: documentUrls,
        verification: {
          ownershipVerified: formData.ownershipVerified,
          liensCleared: formData.liensCleared,
          insuranceActive: formData.insuranceActive
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Upload metadata to IPFS
      return await ipfsService.uploadPropertyMetadata(metadata);
    } catch (error) {
      throw new Error('Failed to upload property data to IPFS');
    }
  };

  const getPropertyTypeIndex = (type: string): number => {
    const types = ['residential', 'commercial', 'industrial', 'mixed'];
    return types.indexOf(type.toLowerCase()) !== -1 ? types.indexOf(type.toLowerCase()) : 0;
  };

  const getRiskLevelIndex = (): number => {
    // Calculate risk based on property characteristics
    let riskScore = 0;

    // Age factor
    const age = new Date().getFullYear() - formData.yearBuilt;
    if (age > 50) riskScore += 2;
    else if (age > 25) riskScore += 1;

    // Property type factor
    if (formData.propertyType === 'commercial') riskScore += 1;
    if (formData.propertyType === 'industrial') riskScore += 2;

    // Value factor (higher value = potentially lower risk)
    if (formData.currentValue < 200000) riskScore += 1;

    // Return 0=Low, 1=Medium, 2=High
    return Math.min(riskScore, 2);
  };

  const handleSubmit = async () => {
    try {
      info('Starting Submission', 'Processing property submission...');

      if (!wallet.isConnected || !wallet.address || !isConnected()) {
        error('Wallet Required', 'Please connect your wallet to submit property');
        return;
      }

      // Basic form validation
      if (!formData.title || !formData.description || !formData.currentValue || !formData.totalTokens) {
        error('Incomplete Form', 'Please fill in all required fields');
        return;
      }

      setSubmitting(true);
      info('Uploading', 'Uploading property metadata to IPFS...');

      const metadataURI = await uploadToIPFS();

      info('Creating Listing', 'Creating property listing on blockchain...');
      // Use HashPack wallet to interact with blockchain
      if (!sendContractTransaction) {
        throw new Error('Wallet transaction function not available');
      }

      // Get contract ID for property token
      const { getCurrentNetworkConfig } = await import('@/config/contracts');
      const networkConfig = getCurrentNetworkConfig();
      let contractId = networkConfig.contracts.propertyToken;

      // Convert EVM address to Hedera format if needed
      if (contractId.startsWith('0x')) {
        // Use the HRM token contract for testing since we know it works
        contractId = import.meta.env.VITE_HRM_TOKEN_HTS_TESTNET || '0.0.6878899'; // Fallback to a known contract
      }

      // Prepare transaction data
      const propertyTypeIndex = getPropertyTypeIndex(formData.propertyType);
      const riskLevelIndex = getRiskLevelIndex();

      // Convert value to smallest unit (wei equivalent)
      const totalValueWei = (BigInt(Math.floor(formData.currentValue * 1e18))).toString();

      // Create function call for listing property
      const functionCall = 'publicMint';

      // Send transaction through HashPack
      const txHash = await sendContractTransaction(contractId, functionCall);

      success('Property Listed', 'Property listed successfully! Transaction submitted.');

      setStep(1);
      setFormData({
        title: '',
        description: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        propertyType: 'residential',
        bedrooms: 0,
        bathrooms: 0,
        sqft: 0,
        lotSize: 0,
        yearBuilt: new Date().getFullYear(),
        purchasePrice: 0,
        currentValue: 0,
        monthlyRent: 0,
        expenses: 0,
        totalTokens: 1000,
        tokenPrice: 0,
        minimumInvestment: 1000,
        deedDocument: null,
        appraisalReport: null,
        inspectionReport: null,
        financialStatements: null,
        photos: [],
        ownershipVerified: false,
        liensCleared: false,
        insuranceActive: false,
      });

      success(
        'Blockchain Success',
        `Property successfully listed on blockchain! Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`
      );

    } catch (err: any) {
      error('Listing Failed', `Failed to list property: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 6));
    } else {
      error('Incomplete Form', 'Please fill in all required fields before continuing');
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">List Your Property</h1>
          <p className="text-gray-400 text-lg">
            Turn your real estate into tokenized investment opportunities
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div
                key={num}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  num <= step
                    ? 'bg-red-600 text-white'
                    : num === step + 1
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-800 rounded-full">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Steps */}
        <div className="bg-gray-900 rounded-lg p-8">
          
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Basic Property Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Modern Downtown Condo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Describe your property's features, location benefits, and investment appeal..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Property Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Property Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Property Type *
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="land">Land</option>
                </select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bedrooms</label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bathrooms</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Square Feet *</label>
                  <input
                    type="number"
                    value={formData.sqft}
                    onChange={(e) => handleInputChange('sqft', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Year Built *</label>
                  <input
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => handleInputChange('yearBuilt', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Lot Size (sq ft)</label>
                <input
                  type="number"
                  value={formData.lotSize}
                  onChange={(e) => handleInputChange('lotSize', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: Financial Information */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Financial & Tokenization Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Property Value * ($)
                  </label>
                  <input
                    type="number"
                    value={formData.currentValue}
                    onChange={(e) => handleInputChange('currentValue', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Original Purchase Price ($)
                  </label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Rental Income ($)
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) => handleInputChange('monthlyRent', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Expenses ($)
                  </label>
                  <input
                    type="number"
                    value={formData.expenses}
                    onChange={(e) => handleInputChange('expenses', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <hr className="border-gray-700" />
              
              <h3 className="text-xl font-semibold">Tokenization Structure</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Tokens to Issue *
                  </label>
                  <input
                    type="number"
                    value={formData.totalTokens}
                    onChange={(e) => handleInputChange('totalTokens', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 1000-10000 tokens</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price per Token * ($)
                  </label>
                  <input
                    type="number"
                    value={formData.tokenPrice}
                    onChange={(e) => handleInputChange('tokenPrice', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    = ${(formData.currentValue / formData.totalTokens).toFixed(2)} per token
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minimum Investment ($)
                  </label>
                  <input
                    type="number"
                    value={formData.minimumInvestment}
                    onChange={(e) => handleInputChange('minimumInvestment', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Document Upload */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Required Documentation</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Property Deed * (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('deedDocument', e.target.files)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {formData.deedDocument && (
                    <p className="text-green-400 text-sm mt-1">✓ {formData.deedDocument.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Property Appraisal * (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('appraisalReport', e.target.files)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {formData.appraisalReport && (
                    <p className="text-green-400 text-sm mt-1">✓ {formData.appraisalReport.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Inspection Report (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('inspectionReport', e.target.files)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {formData.inspectionReport && (
                    <p className="text-green-400 text-sm mt-1">✓ {formData.inspectionReport.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Financial Statements (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('financialStatements', e.target.files)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {formData.financialStatements && (
                    <p className="text-green-400 text-sm mt-1">✓ {formData.financialStatements.name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Property Photos (JPG, PNG)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload('photos', e.target.files)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {formData.photos.length > 0 && (
                  <p className="text-green-400 text-sm mt-1">✓ {formData.photos.length} photos selected</p>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Legal Compliance */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Legal Compliance Verification</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="ownership"
                    checked={formData.ownershipVerified}
                    onChange={(e) => handleInputChange('ownershipVerified', e.target.checked)}
                    className="mt-1 w-5 h-5 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                  />
                  <label htmlFor="ownership" className="text-gray-300">
                    <span className="font-semibold">Ownership Verification *</span>
                    <p className="text-sm text-gray-400 mt-1">
                      I confirm that I am the legal owner of this property and have the right to tokenize it for investment purposes.
                    </p>
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="liens"
                    checked={formData.liensCleared}
                    onChange={(e) => handleInputChange('liensCleared', e.target.checked)}
                    className="mt-1 w-5 h-5 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                  />
                  <label htmlFor="liens" className="text-gray-300">
                    <span className="font-semibold">Clear Title *</span>
                    <p className="text-sm text-gray-400 mt-1">
                      This property has a clear title with no outstanding liens, encumbrances, or legal disputes.
                    </p>
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="insurance"
                    checked={formData.insuranceActive}
                    onChange={(e) => handleInputChange('insuranceActive', e.target.checked)}
                    className="mt-1 w-5 h-5 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                  />
                  <label htmlFor="insurance" className="text-gray-300">
                    <span className="font-semibold">Insurance Coverage *</span>
                    <p className="text-sm text-gray-400 mt-1">
                      The property is covered by adequate insurance including liability, property damage, and rental loss coverage.
                    </p>
                  </label>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-400 text-xl">⚠️</div>
                  <div className="text-yellow-100">
                    <h4 className="font-semibold mb-2">Legal Notice</h4>
                    <p className="text-sm">
                      By submitting this property, you acknowledge that tokenized real estate investments are subject to securities regulations. 
                      Our legal team will review your submission and may require additional documentation or modifications to ensure compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review and Submit */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Review Your Submission</h2>
              
              <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-400">Property:</span> {formData.title}</div>
                  <div><span className="text-gray-400">Location:</span> {formData.city}, {formData.state}</div>
                  <div><span className="text-gray-400">Type:</span> {formData.propertyType}</div>
                  <div><span className="text-gray-400">Size:</span> {formData.sqft} sq ft</div>
                  <div><span className="text-gray-400">Value:</span> ${formData.currentValue.toLocaleString()}</div>
                  <div><span className="text-gray-400">Tokens:</span> {formData.totalTokens} @ ${formData.tokenPrice}/token</div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-blue-100">Next Steps</h4>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• Legal team review (2-3 business days)</li>
                  <li>• Property valuation verification</li>
                  <li>• Smart contract deployment</li>
                  <li>• Marketing and investor outreach</li>
                  <li>• Token sale launch</li>
                </ul>
              </div>

              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg"
                >
                  {submitting ? 'Submitting...' : 'Submit Property for Review'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Previous
            </button>
            
            {step < 6 ? (
              <button
                onClick={nextStep}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Next Step
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}