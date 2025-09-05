import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { UserPlus, CheckCircle, AlertCircle, Camera, Upload, User, ArrowLeft } from 'lucide-react';
import { useCandidateContext } from '../context/CandidateContext';
import { apiRequest, queryClient } from '../lib/queryClient';
import ImageCropper from '../components/ImageCropper';
import { DynamicSelectInput } from '../components/DynamicSelectInput';

const RegistrationPage = () => {
  const [, setLocation] = useLocation();
  const { currentCandidate, verifiedMobile } = useCandidateContext();
  
  const [formData, setFormData] = useState({
    // Required fields from Excel
    location: '',
    name: '',
    aadhar: '',
    dob: '',
    gender: '',
    mobile: '',
    
    // Optional fields from Excel
    religion: '',
    vulnerability: '',
    annualIncome: '',
    educationalQualification: '',
    assessmentDate: '',
    dlNo: '',
    dlType: '',
    licenseExpiryDate: '',
    dependentFamilyMembers: '',
    ownerDriver: '',
    abhaNo: '',
    jobRole: '',
    jobCode: '',
    emailAddress: '',
    youTube: 'No',
    facebook: 'No',
    instagram: 'No',
    ekycStatus: 'REGISTER',
    personalEmailAddress: '',
    
    // System fields
    trained: false,
    status: 'Enrolled'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');

  const locations = [
    'BAKROL', 'MUMBAI', 'DELHI', 'BANGALORE', 'CHENNAI', 'HYDERABAD', 'PUNE', 'KOLKATA'
  ];

  const genders = ['Male', 'Female', 'Other'];
  
  const vulnerabilityCategories = ['General', 'OBC', 'SC', 'ST', 'OC'];
  
  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];
  
  const incomeCategories = [
    'Less than 1 Lac',
    '1-2 Lac',
    '2-3 Lac', 
    '3-5 Lac',
    'Above 5 Lac'
  ];
  
  const educationLevels = [
    '5TH', '8TH', '10TH', '12TH', 'GRADUATE', 'POST GRADUATE', 'DIPLOMA', 'ITI'
  ];
  
  const dlTypes = ['LMV', 'TRANS', 'HMV', 'LMV-NT', 'MCWG', 'MCWOG'];
  
  const ownerDriverOptions = ['Owner', 'Driver', 'Both'];
  
  const jobRoles = [
    'Commercial Vehicle Driver Level 4',
    'Light Motor Vehicle Driver',
    'Heavy Motor Vehicle Driver',
    'Passenger Vehicle Driver'
  ];

  useEffect(() => {
    if (currentCandidate) {
      setFormData(prev => ({
        ...prev,
        name: currentCandidate.name || '',
        dob: currentCandidate.dob || '',
        mobile: verifiedMobile || currentCandidate.mobile || '',
        aadhar: currentCandidate.aadhar || '',
        gender: currentCandidate.gender || '',
      }));
    } else if (verifiedMobile) {
      setFormData(prev => ({
        ...prev,
        mobile: verifiedMobile
      }));
    }
  }, [currentCandidate, verifiedMobile]);

  const validateDrivingLicense = (dlNumber: string): boolean => {
    // Indian DL format: AA-NN-NNNN-NNNNNNN (16 characters including hyphens)
    // AA = 2 letter state code, NN = 2 digit RTO code, NNNN = 4 digit year, NNNNNNN = 7 digit unique number
    const dlPattern = /^[A-Z]{2}-\d{2}-\d{4}-\d{7}$/;
    return dlPattern.test(dlNumber);
  };

  const validateAbhaNumber = (abhaNumber: string): boolean => {
    // ABHA number: 14-digit number
    const abhaPattern = /^\d{14}$/;
    return abhaPattern.test(abhaNumber.replace(/\s|-/g, ''));
  };

  const validateJobCode = (jobCode: string): boolean => {
    // Job codes: 2-8 characters (digits or alphanumeric for Indian classification systems)
    const jobCodePattern = /^[A-Za-z0-9\/]{2,12}$/;
    return jobCodePattern.test(jobCode);
  };

  const formatDrivingLicense = (value: string): string => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Apply formatting: AA-NN-NNNN-NNNNNNN
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    } else if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4)}`;
    } else if (cleaned.length <= 15) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    } else {
      // Truncate if too long
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 15)}`;
    }
  };

  const formatAbhaNumber = (value: string): string => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/[^0-9]/g, '');
    // Limit to 14 digits
    return cleaned.slice(0, 14);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for driving license number
    if (name === 'dlNo') {
      const formattedValue = formatDrivingLicense(value);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
      
      // Clear any previous DL validation errors
      if (error && error.includes('driving license')) {
        setError('');
      }
      return;
    }

    // Special handling for ABHA number
    if (name === 'abhaNo') {
      const formattedValue = formatAbhaNumber(value);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-set job code based on job role
    if (name === 'jobRole' && value === 'Commercial Vehicle Driver Level 4') {
      setFormData(prev => ({ ...prev, jobCode: 'ASC/Q9703' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    setImageUploading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setOriginalImageUrl(imageUrl);
      setShowImageCropper(true);
      setImageUploading(false);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
      setImageUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setProfileImage(croppedImageUrl);
    setShowImageCropper(false);
  };

  const handleCropCancel = () => {
    setShowImageCropper(false);
    setOriginalImageUrl('');
  };

  const createCandidateMutation = useMutation({
    mutationFn: async (candidateData: any) => {
      return await apiRequest('/api/candidates', {
        method: 'POST',
        body: JSON.stringify(candidateData)
      });
    },
    onSuccess: (data) => {
      setCandidateId(data.candidateId);
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      setLoading(false);
    },
    onError: (error: any) => {
      setError(error.message || 'Registration failed');
      setLoading(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check all mandatory fields
    const requiredFields = [
      { field: 'name', name: 'Full Name' },
      { field: 'aadhar', name: 'Aadhar Number' },
      { field: 'mobile', name: 'Mobile Number' },
      { field: 'location', name: 'Location' },
      { field: 'gender', name: 'Gender' },
      { field: 'dob', name: 'Date of Birth' },
      { field: 'religion', name: 'Religion' },
      { field: 'vulnerability', name: 'Category' },
      { field: 'annualIncome', name: 'Annual Income' },
      { field: 'educationalQualification', name: 'Educational Qualification' },
      { field: 'assessmentDate', name: 'Assessment Date' },
      { field: 'dlNo', name: 'Driving License Number' },
      { field: 'dlType', name: 'DL Type' },
      { field: 'licenseExpiryDate', name: 'License Expiry Date' },
      { field: 'dependentFamilyMembers', name: 'Dependent Family Members' },
      { field: 'ownerDriver', name: 'Owner/Driver' },
      { field: 'jobRole', name: 'Job Role' },
      { field: 'jobCode', name: 'Job Code' },
      { field: 'emailAddress', name: 'Official Email Address' },
      { field: 'personalEmailAddress', name: 'Personal Email Address' }
    ];

    const missingFields = requiredFields.filter(({ field }) => !formData[field as keyof typeof formData] || formData[field as keyof typeof formData].toString().trim() === '');
    
    if (missingFields.length > 0) {
      setError(`Please fill in the following required fields: ${missingFields.map(f => f.name).join(', ')}`);
      return;
    }

    // Validate driving license format
    if (formData.dlNo && !validateDrivingLicense(formData.dlNo)) {
      setError('Please enter a valid driving license number in the format: AA-NN-NNNN-NNNNNNN');
      return;
    }

    // Validate ABHA number if provided
    if (formData.abhaNo && !validateAbhaNumber(formData.abhaNo)) {
      setError('Please enter a valid 14-digit ABHA number');
      return;
    }

    // Validate job code
    if (formData.jobCode && !validateJobCode(formData.jobCode)) {
      setError('Please enter a valid job code (2-12 characters)');
      return;
    }

    setLoading(true);
    setError('');

    const candidateData = {
      ...formData,
      profileImage: profileImage || ''
    };

    createCandidateMutation.mutate(candidateData);
  };

  const goBack = () => {
    setLocation('/verification');
  };

  if (candidateId) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-green-600 mb-6">
          <CheckCircle className="w-16 h-16 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Registration Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your candidate ID is: <span className="font-mono font-bold text-lg text-blue-600">{candidateId}</span>
        </p>
        <div className="space-y-3">
          <button
            onClick={() => setLocation('/verification')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Register Another Candidate
          </button>
          <button
            onClick={() => setLocation('/admin')}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            View Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url('/images/Registration.jpg')`
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50/90 via-white/95 to-indigo-50/90">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <button
                onClick={goBack}
                className="mr-4 p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <UserPlus className="w-8 h-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Candidate Registration</h1>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                        <User className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                      <Camera className="w-5 h-5 mr-2" />
                      {imageUploading ? 'Uploading...' : 'Upload Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={imageUploading}
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">Max 5MB, JPG/PNG format</p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DynamicSelectInput
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  suggestions={locations}
                  placeholder="Select or enter location"
                  required
                  label="Location"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="aadhar"
                    value={formData.aadhar}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="gender"
                    value={formData.gender}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    readOnly
                  />
                </div>

                <DynamicSelectInput
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  suggestions={religions}
                  placeholder="Select or enter religion"
                  required
                  label="Religion"
                />

                <DynamicSelectInput
                  name="vulnerability"
                  value={formData.vulnerability}
                  onChange={handleInputChange}
                  suggestions={vulnerabilityCategories}
                  placeholder="Select or enter category"
                  required
                  label="Category"
                />

                <DynamicSelectInput
                  name="annualIncome"
                  value={formData.annualIncome}
                  onChange={handleInputChange}
                  suggestions={incomeCategories}
                  placeholder="Select or enter income range"
                  required
                  label="Annual Income"
                />

                <DynamicSelectInput
                  name="educationalQualification"
                  value={formData.educationalQualification}
                  onChange={handleInputChange}
                  suggestions={educationLevels}
                  placeholder="Select or enter education level"
                  required
                  label="Educational Qualification"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="assessmentDate"
                    value={formData.assessmentDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driving License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="dlNo"
                    value={formData.dlNo}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.dlNo && !validateDrivingLicense(formData.dlNo) 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="AA-NN-NNNN-NNNNNNN (e.g., MH-12-2020-1234567)"
                    maxLength={18}
                  />
                  {formData.dlNo && !validateDrivingLicense(formData.dlNo) && (
                    <p className="text-red-500 text-sm mt-1">
                      Please enter a valid Indian driving license format: AA-NN-NNNN-NNNNNNN
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Format: State Code-RTO Code-Year-Unique Number
                  </p>
                </div>

                <DynamicSelectInput
                  name="dlType"
                  value={formData.dlType}
                  onChange={handleInputChange}
                  suggestions={dlTypes}
                  placeholder="Select or enter DL type"
                  required
                  label="DL Type"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="licenseExpiryDate"
                    value={formData.licenseExpiryDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. of Dependent Family Members <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="dependentFamilyMembers"
                    value={formData.dependentFamilyMembers}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <DynamicSelectInput
                  name="ownerDriver"
                  value={formData.ownerDriver}
                  onChange={handleInputChange}
                  suggestions={ownerDriverOptions}
                  placeholder="Select or enter type"
                  required
                  label="Owner/Driver"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ABHA Number</label>
                  <input
                    type="text"
                    name="abhaNo"
                    value={formData.abhaNo}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.abhaNo && !validateAbhaNumber(formData.abhaNo) 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="14-digit ABHA Number (e.g., 12345678901234)"
                    maxLength={14}
                  />
                  {formData.abhaNo && !validateAbhaNumber(formData.abhaNo) && (
                    <p className="text-red-500 text-sm mt-1">
                      Please enter a valid 14-digit ABHA number
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Ayushman Bharat Health Account number (14 digits)
                  </p>
                </div>

                <DynamicSelectInput
                  name="jobRole"
                  value={formData.jobRole}
                  onChange={handleInputChange}
                  suggestions={jobRoles}
                  placeholder="Select or enter job role"
                  required
                  label="Job Role"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="jobCode"
                    value={formData.jobCode}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.jobCode && !validateJobCode(formData.jobCode) 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Job Code (e.g., ASC/Q9703, 12345678)"
                    maxLength={12}
                  />
                  {formData.jobCode && !validateJobCode(formData.jobCode) && (
                    <p className="text-red-500 text-sm mt-1">
                      Please enter a valid job code (2-12 characters)
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    NIC/NCO classification code (2-8 digits or alphanumeric)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Official Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Official email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="personalEmailAddress"
                    value={formData.personalEmailAddress}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Personal email"
                  />
                </div>
              </div>

              {/* Social Media Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-200 pt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
                  <select
                    name="youTube"
                    value={formData.youTube}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                  <select
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                  <select
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Complete Registration
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showImageCropper && originalImageUrl && (
        <ImageCropper
          imageUrl={originalImageUrl}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default RegistrationPage;