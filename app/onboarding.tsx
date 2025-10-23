import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Globe, MapPin, DollarSign, Check } from '@/components/SmartIcons';
import { useAppSettings, Language, Currency } from '@/hooks/app-settings-store';
import { SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES, POPULAR_COUNTRIES } from '@/constants/localization';
import { Colors } from '@/constants/colors';

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateLanguage, updateLocation, updateCurrency, completeOnboarding } = useAppSettings();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const steps = [
    { title: 'Welcome', subtitle: 'Let&apos;s personalize your experience', icon: Globe },
    { title: 'Language', subtitle: 'Choose your preferred language', icon: Globe },
    { title: 'Location', subtitle: 'Where are you located?', icon: MapPin },
    { title: 'Currency', subtitle: 'Select your preferred currency', icon: DollarSign },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setSearchQuery('');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSearchQuery('');
    }
  };

  const handleComplete = async () => {
    if (!selectedLanguage || !selectedCountry || !selectedCity || !selectedCurrency) {
      return;
    }

    setIsProcessing(true);
    
    updateLanguage(selectedLanguage);
    updateLocation({
      country: selectedCountry,
      city: selectedCity,
    });
    updateCurrency(selectedCurrency);
    completeOnboarding();

    setTimeout(() => {
      router.replace('/login');
    }, 500);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return selectedLanguage !== null;
      case 2:
        return selectedCountry !== '' && selectedCity !== '';
      case 3:
        return selectedCurrency !== null;
      default:
        return false;
    }
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCountries = POPULAR_COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(currency =>
    currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome to Club Sincrónica</Text>
            <Text style={styles.welcomeSubtitle}>
              Let&apos;s build community
            </Text>
            <Text style={styles.welcomeDescription}>
              We&apos;ll help you set up your preferences for the best experience
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNext}
              testID="welcome-continue"
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.authButtonsContainer}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/login')}
                testID="login-button"
              >
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => router.push('/signup')}
                testID="signup-button"
              >
                <Text style={styles.signupButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search languages..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
              testID="language-search"
            />
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {filteredLanguages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.optionItem,
                    selectedLanguage?.code === language.code && styles.selectedOption
                  ]}
                  onPress={() => setSelectedLanguage(language)}
                  testID={`language-${language.code}`}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{language.nativeName}</Text>
                    <Text style={styles.optionSubtitle}>{language.name}</Text>
                  </View>
                  {selectedLanguage?.code === language.code && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search countries..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
              testID="country-search"
            />
            {!selectedCountry ? (
              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {filteredCountries.map((country) => (
                  <TouchableOpacity
                    key={country.code}
                    style={[
                      styles.optionItem,
                      selectedCountry === country.name && styles.selectedOption
                    ]}
                    onPress={() => {
                      setSelectedCountry(country.name);
                      setSearchQuery('');
                    }}
                    testID={`country-${country.code}`}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.countryFlag}>{country.flag}</Text>
                      <Text style={styles.optionTitle}>{country.name}</Text>
                    </View>
                    {selectedCountry === country.name && (
                      <Check size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.cityInputContainer}>
                <Text style={styles.selectedCountryText}>
                  Selected: {selectedCountry}
                </Text>
                <TextInput
                  style={styles.cityInput}
                  placeholder="Enter your city..."
                  value={selectedCity}
                  onChangeText={setSelectedCity}
                  placeholderTextColor="#999"
                  autoFocus
                  testID="city-input"
                />
                <TouchableOpacity
                  style={styles.changeCountryButton}
                  onPress={() => {
                    setSelectedCountry('');
                    setSelectedCity('');
                  }}
                >
                  <Text style={styles.changeCountryText}>Change Country</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search currencies..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
              testID="currency-search"
            />
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {filteredCurrencies.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.optionItem,
                    selectedCurrency?.code === currency.code && styles.selectedOption
                  ]}
                  onPress={() => setSelectedCurrency(currency)}
                  testID={`currency-${currency.code}`}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.optionTitle}>{currency.code}</Text>
                      <Text style={styles.optionSubtitle}>{currency.name}</Text>
                    </View>
                  </View>
                  {selectedCurrency?.code === currency.code && (
                    <Check size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {currentStep > 0 && (
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index <= currentStep && styles.progressDotActive
                  ]}
                />
              ))}
            </View>
            <View style={styles.backButton} />
          </View>
        )}

        <View style={styles.content}>
          {currentStep > 0 && (
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
              <Text style={styles.stepSubtitle}>{steps[currentStep].subtitle}</Text>
            </View>
          )}

          {renderStepContent()}
        </View>

        {currentStep > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                !canProceed() && styles.continueButtonDisabled
              ]}
              onPress={currentStep === steps.length - 1 ? handleComplete : handleNext}
              disabled={!canProceed() || isProcessing}
              testID="continue-button"
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.continueButtonText}>
                    {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
                  </Text>
                  <ChevronRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 50,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepHeader: {
    marginTop: 30,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 20,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  stepContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  optionsList: {
    flex: 1,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  countryFlag: {
    fontSize: 24,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    width: 40,
    textAlign: 'center',
  },
  currencyInfo: {
    flex: 1,
  },
  cityInputContainer: {
    flex: 1,
    paddingTop: 20,
  },
  selectedCountryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  cityInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  changeCountryButton: {
    alignSelf: 'flex-start',
  },
  changeCountryText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  authButtonsContainer: {
    marginTop: 30,
    width: '100%',
    gap: 12,
  },
  loginButton: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
