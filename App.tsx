
import React, { useState, useEffect, useCallback } from 'react';
import { CertificateData, ValidationStatus } from './types';
import { POTENTIAL_FOLIO_HEADERS } from './constants';
import { loadDatabase } from './services/databaseService';
import { getFlexibleProperty, playSound } from './utils/helpers';

import Header from './components/Header';
import Footer from './components/Footer';
import SearchForm from './components/SearchForm';
import ValidationResult from './components/ValidationResult';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificateData, setCertificateData] = useState<CertificateData[]>([]);
  const [query, setQuery] = useState('');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>(ValidationStatus.IDLE);
  const [validationResult, setValidationResult] = useState<CertificateData | null>(null);

  useEffect(() => {
    const fetchDatabase = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await loadDatabase();
        setCertificateData(data);
      } catch (e) {
        console.error("Error loading database:", e);
        const errorMessage = e instanceof Error ? e.message : 'Error de red al cargar la base de datos.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchDatabase();
  }, []);

  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery || certificateData.length === 0) {
      setValidationStatus(ValidationStatus.IDLE);
      setValidationResult(null);
      return;
    }
    const cleanedQuery = searchQuery.trim().toLowerCase();
    const result = certificateData.find(record => {
      const folioValue = getFlexibleProperty(record, POTENTIAL_FOLIO_HEADERS);
      return folioValue && String(folioValue).trim().toLowerCase() === cleanedQuery;
    });

    if (result) {
      setValidationResult(result);
      setValidationStatus(ValidationStatus.SUCCESS);
      playSound('beep-success');
    } else {
      setValidationResult(null);
      setValidationStatus(ValidationStatus.NOT_FOUND);
      playSound('beep-fail');
      setTimeout(() => playSound('beep-fail'), 300);
    }
  }, [certificateData]);

  const handleClear = useCallback(() => {
    setQuery('');
    setValidationStatus(ValidationStatus.IDLE);
    setValidationResult(null);
  }, []);

  const renderContent = () => {
    if (loading) return <div className="text-center p-8"><p className="text-gray-600">Cargando base de datos...</p></div>;
    if (error) return <div className="text-center p-8 text-red-600"><p>{error}</p></div>;
    if (certificateData.length > 0) {
      return (
        <>
          <SearchForm
            query={query}
            setQuery={setQuery}
            onSearch={handleSearch}
            onClear={handleClear}
          />
          <ValidationResult status={validationStatus} result={validationResult} />
        </>
      );
    }
    return <div className="text-center p-8"><p className="text-gray-600">No se pudo cargar la base de datos.</p></div>;
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col items-center">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 w-full flex flex-col items-center">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
