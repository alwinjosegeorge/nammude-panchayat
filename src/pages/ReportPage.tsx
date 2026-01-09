import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CategorySelector } from '@/components/CategorySelector';
import { PhotoUpload } from '@/components/PhotoUpload';
import { LocationMap } from '@/components/LocationMap';
import { detectLocation, reverseGeocode } from '@/lib/geocoding';
import { api } from '@/lib/api';
import { Category, Urgency, Report, categoryToTeam, LocationData as BaseLocationData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MapPin, Camera, X, Upload, Loader2, CheckCircle, Copy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import {
  KERALA_DISTRICTS,
  KERALA_PANCHAYATS,
  District
} from '@/lib/kerala-data';

interface LocationData extends BaseLocationData {
  isManual?: boolean;
}

const generateTrackingId = () => {
  return 'TRK' + Math.floor(100000 + Math.random() * 900000).toString();
};

export default function ReportPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Form state
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [urgency, setUrgency] = useState<Urgency>('normal');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  // Auto-select District/Panchayat if detected
  useEffect(() => {
    if (location?.panchayat) {
      // Try to find which district this panchayat belongs to
      for (const dist of KERALA_DISTRICTS) {
        if (KERALA_PANCHAYATS[dist].includes(location.panchayat)) {
          setSelectedDistrict(dist);
          break;
        }
      }
    }
  }, [location?.panchayat]);

  // UI state
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPanchayatOptions, setShowPanchayatOptions] = useState(false);

  // Draft logic removed for Supabase integration cleanup

  const setManualLocation = (isManual: boolean) => {
    setLocation(prev => prev ? ({ ...prev, isManual }) : null);
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    setManualLocation(false); // Ensure manual mode is off initially for retry

    // Toast: Requesting Location
    toast.message(
      language === 'en' ? 'Requesting Location...' : 'സ്ഥലം കണ്ടെത്തുന്നു...',
      { description: language === 'en' ? 'Please allow location access' : 'ദയവായി ലൊക്കേഷൻ അനുമതി നൽകുക' }
    );

    try {
      const data = await detectLocation();
      setLocation({ ...data, isManual: false });

      if (data.possiblePanchayats && data.possiblePanchayats.length > 1) {
        setShowPanchayatOptions(true);
      }
      toast.success(language === 'en' ? 'Location detected!' : 'സ്ഥലം കണ്ടെത്തി!');
    } catch (error) {
      console.error('Location detection failed:', error);
      const err = error as { message: string };

      let errorMsg = language === 'en' ? 'Failed to detect location' : 'സ്ഥലം കണ്ടെത്താനായില്ല';

      if (err.message === 'LOCATION_DENIED') {
        errorMsg = language === 'en' ? 'Location permission denied' : 'ലൊക്കേഷൻ അനുമതി നിരസിച്ചു';
      } else if (err.message === 'LOCATION_TIMEOUT') {
        errorMsg = language === 'en' ? 'Location request timed out' : 'ലൊക്കേഷൻ സമയം കഴിഞ്ഞു';
      } else if (err.message === 'LOCATION_UNAVAILABLE') {
        errorMsg = language === 'en' ? 'Location unavailable' : 'സ്ഥലം ലഭ്യമല്ല';
      }

      toast.error(errorMsg, {
        description: language === 'en' ? 'Switched to manual entry' : 'ഓരു ലൊക്കേഷൻ സ്വയം നൽകുക',
      });

      // Auto-switch to manual mode on failure
      setLocation(prev => ({
        address: prev?.address || '',
        lat: 0,
        lng: 0,
        panchayat: prev?.panchayat || '',
        isManual: true, // Force manual mode
      }));
    } finally {
      setIsDetecting(false);
    }
  };

  const handleMapLocationChange = async (lat: number, lng: number) => {
    const newLocation = await reverseGeocode(lat, lng);
    setLocation(newLocation);

    if (newLocation.possiblePanchayats && newLocation.possiblePanchayats.length > 1) {
      setShowPanchayatOptions(true);
    }
  };

  const handlePanchayatSelect = (panchayat: string) => {
    if (location) {
      setLocation({ ...location, panchayat });
      setShowPanchayatOptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !title || !description || !location) {
      toast.error(language === 'en' ? 'Please fill all required fields' : 'എല്ലാ ആവശ്യമായ ഫീൽഡുകളും പൂരിപ്പിക്കുക');
      return;
    }

    setIsSubmitting(true);

    try {
      const newTrackingId = generateTrackingId();

      const report: Report = {
        id: uuidv4(),
        trackingId: newTrackingId,
        category,
        title,
        description,
        panchayat: location.panchayat,
        address: location.address,
        lat: (location.lat && location.lat !== 0) ? location.lat : undefined,
        lng: (location.lng && location.lng !== 0) ? location.lng : undefined,
        urgency,
        photos,
        contact: anonymous ? undefined : { phone: phone || undefined, email: email || undefined },
        anonymous,
        status: 'submitted',
        assignedTeam: categoryToTeam[category],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [
          {
            status: 'submitted',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await api.createIssue(report);
      // clearDraft(); // Removed
      setTrackingId(newTrackingId);
      setSubmitted(true);

      toast.success(language === 'en' ? 'Report submitted successfully!' : 'റിപ്പോർട്ട് വിജയകരമായി സമർപ്പിച്ചു!');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(language === 'en' ? 'Failed to submit report' : 'റിപ്പോർട്ട് സമർപ്പിക്കാനായില്ല');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingId = () => {
    navigator.clipboard.writeText(trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(language === 'en' ? 'Copied to clipboard!' : 'ക്ലിപ്ബോർഡിലേക്ക് പകർത്തി!');
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-12">
          <div className="max-w-md mx-auto text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>

            <h1 className={cn(
              "text-2xl font-bold text-foreground",
              language === 'ml' && "font-malayalam"
            )}>
              {t.reportSubmitted}
            </h1>

            <div className="card-elevated p-6 space-y-4">
              <p className={cn(
                "text-sm text-muted-foreground",
                language === 'ml' && "font-malayalam"
              )}>
                {t.trackingId}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-primary">{trackingId}</span>
                <button
                  onClick={copyTrackingId}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <Copy className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className={cn(
                "text-xs text-muted-foreground",
                language === 'ml' && "font-malayalam"
              )}>
                {t.trackingIdSaved}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={() => navigate(`/track?id=${trackingId}`)}
                className="w-full btn-primary py-6 text-lg"
              >
                <span className={language === 'ml' ? 'font-malayalam' : ''}>{t.trackYourIssue}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setCategory(null);
                  setTitle('');
                  setDescription('');
                  setPhotos([]);
                  setLocation(null);
                  setUrgency('normal');
                  setPhone('');
                  setEmail('');
                  setAnonymous(false);
                }}
                className="w-full py-6 text-lg"
              >
                <span className={language === 'ml' ? 'font-malayalam' : ''}>
                  {language === 'en' ? 'Submit Another Report' : 'മറ്റൊരു റിപ്പോർട്ട് സമർപ്പിക്കുക'}
                </span>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className={cn(
            "text-2xl font-bold text-foreground mb-8",
            language === 'ml' && "font-malayalam"
          )}>
            {t.reportIssue}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Category Selection */}
            <div className="space-y-3">
              <label className={cn("label-text", language === 'ml' && "font-malayalam")}>
                {t.selectCategory} *
              </label>
              <CategorySelector value={category} onChange={setCategory} />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className={cn("label-text", language === 'ml' && "font-malayalam")}>
                {t.issueTitle} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                placeholder={t.issueTitlePlaceholder}
                className={cn("input-field", language === 'ml' && "font-malayalam")}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground text-right">{title.length}/50</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className={cn("label-text", language === 'ml' && "font-malayalam")}>
                {t.description} *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descriptionPlaceholder}
                rows={4}
                className={cn("input-field resize-none", language === 'ml' && "font-malayalam")}
              />
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <label className={cn("label-text", language === 'ml' && "font-malayalam")}>
                {t.uploadPhotos}
              </label>
              <PhotoUpload photos={photos} onChange={setPhotos} />
            </div>

            {/* Location */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className={cn("label-text mb-0", language === 'ml' && "font-malayalam")}>
                  {t.location} *
                </label>
                <div className="flex gap-2 p-1 bg-secondary rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setLocation(prev => prev ? { ...prev, isManual: false } : null);
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      !location?.isManual ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.autoDetect}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Preserve address if switching, but set isManual flag
                      setLocation(prev => ({
                        address: prev?.address || '',
                        lat: prev?.lat,
                        lng: prev?.lng,
                        panchayat: prev?.panchayat || '',
                        possiblePanchayats: prev?.possiblePanchayats,
                        isManual: true
                      }));
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      location?.isManual ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.manualEntry}
                  </button>
                </div>
              </div>

              {!location?.isManual ? (
                // Auto Detect Mode
                <div className="space-y-4 animate-fade-in">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-auto py-4 justify-start"
                    onClick={handleDetectLocation}
                    disabled={isDetecting}
                  >
                    <div className="flex items-start gap-3 text-left">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        {isDetecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
                      </div>
                      <div>
                        <span className={cn("font-medium block", language === 'ml' && "font-malayalam")}>
                          {isDetecting ? t.detecting : t.detectLocation}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5 block">
                          {language === 'en' ? 'Use GPS to find your location' : 'നിങ്ങളുടെ സ്ഥലം കണ്ടെത്താൻ GPS ഉപയോഗിക്കുക'}
                        </span>
                      </div>
                    </div>
                  </Button>

                  {location && location.lat && (
                    <div className="space-y-4 animate-slide-up">
                      {/* Panchayat Options */}
                      {showPanchayatOptions && location.possiblePanchayats && (
                        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 space-y-3">
                          <div className="flex items-center gap-2 text-warning">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {language === 'en' ? 'Multiple locations found' : 'ഒന്നിലധികം ലൊക്കേഷനുകൾ കണ്ടെത്തി'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {location.possiblePanchayats.map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => handlePanchayatSelect(p)}
                                className={cn(
                                  "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                                  location.panchayat === p
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card border-border hover:border-primary"
                                )}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <LocationMap
                        lat={location.lat!}
                        lng={location.lng!}
                        onLocationChange={handleMapLocationChange}
                        draggable={true}
                        className="h-48 rounded-lg border border-border"
                      />
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-dashed">
                        <p className="font-medium text-foreground mb-1">{location.panchayat}</p>
                        <p>{location.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Manual / Dropdown Selection
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className={cn("label-text", language === 'ml' && "font-malayalam")}>
                      {t.address} *
                    </label>
                    <textarea
                      value={location?.address || ''}
                      onChange={(e) => setLocation(prev => ({
                        ...prev!,
                        address: e.target.value,
                        isManual: true,
                        panchayat: prev?.panchayat || ''
                      }))}
                      placeholder={language === 'en' ? "Enter detailed address / landmark..." : "വിശദമായ വിലാസം / ലാൻഡ്മാർക്ക് നൽകുക..."}
                      className={cn("input-field min-h-[100px]", language === 'ml' && "font-malayalam")}
                    />
                  </div>

                  {/* District Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={cn("label-text", language === 'ml' && "font-malayalam")}>
                        {language === 'en' ? 'District' : 'ജില്ല'} *
                      </label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => {
                          setSelectedDistrict(e.target.value as District);
                          // Clear panchayat if district changes
                          setLocation(prev => prev ? ({ ...prev, panchayat: '' }) : null);
                        }}
                        className={cn("input-field w-full", language === 'ml' && "font-malayalam")}
                      >
                        <option value="">{language === 'en' ? 'Select District' : 'ജില്ല തിരഞ്ഞെടുക്കുക'}</option>
                        {KERALA_DISTRICTS.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>

                    {/* Panchayat Selection */}
                    <div>
                      <label className={cn("label-text", language === 'ml' && "font-malayalam")}>
                        {t.panchayatName} *
                      </label>
                      <select
                        value={location?.panchayat || ''}
                        onChange={(e) => setLocation(prev => ({ ...prev!, panchayat: e.target.value }))}
                        disabled={!selectedDistrict}
                        className={cn("input-field w-full", language === 'ml' && "font-malayalam")}
                      >
                        <option value="">
                          {selectedDistrict
                            ? (language === 'en' ? 'Select Panchayat' : 'പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക')
                            : (language === 'en' ? 'Select District First' : 'ആദ്യം ജില്ല തിരഞ്ഞെടുക്കുക')
                          }
                        </option>
                        {selectedDistrict && KERALA_PANCHAYATS[selectedDistrict]?.map(panch => (
                          <option key={panch} value={panch}>{panch}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Urgency */}
            <div className="space-y-3">
              <label className={cn("label-text", language === 'ml' && "font-malayalam")}>
                {t.urgencyLevel}
              </label>
              <div className="flex gap-3">
                {(['normal', 'high', 'urgent'] as Urgency[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all",
                      urgency === level
                        ? level === 'urgent'
                          ? "border-urgent bg-urgent/10 text-urgent"
                          : level === 'high'
                            ? "border-warning bg-warning/10 text-warning"
                            : "border-success bg-success/10 text-success"
                        : "border-border hover:border-primary/50",
                      language === 'ml' && "font-malayalam"
                    )}
                  >
                    {level === 'urgent' ? t.urgent : level === 'high' ? t.high : t.normal}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact (Optional) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className={cn("label-text mb-0", language === 'ml' && "font-malayalam")}>
                  {t.contactOptional}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className={cn("text-sm text-muted-foreground", language === 'ml' && "font-malayalam")}>
                    {t.submitAnonymously}
                  </span>
                </label>
              </div>

              {!anonymous && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                  <div>
                    <label className={cn("label-text", language === 'ml' && "font-malayalam")}>
                      {t.phone}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className={cn("label-text", language === 'ml' && "font-malayalam")}>
                      {t.email}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="input-field"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !category || !title || !description || !location}
              className="w-full btn-primary py-6 text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  <span className={language === 'ml' ? 'font-malayalam' : ''}>{t.submitting}</span>
                </>
              ) : (
                <span className={language === 'ml' ? 'font-malayalam' : ''}>{t.submit}</span>
              )}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
