import { useState, useEffect } from 'react';
import { Edit3, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WidgetProps } from '@/types/dashboard';
import { useUserProfile } from '@/hooks/useUserProfile';
import { BackgroundBeams } from '@/components/ui/shadcn-io/background-beams';
import { DarkVeilBackground } from '@/components/ui/shadcn-io/dark-veil-background';

function CompanyMottoCardContent({ isDarkMode }: { isDarkMode: boolean }) {
  const [isEditingMotto, setIsEditingMotto] = useState(false);
  const [isEditingSubtext, setIsEditingSubtext] = useState(false);
  const { profile, updateCompanyMotto, updateCompanySubtext } = useUserProfile();
  const [tempMotto, setTempMotto] = useState(profile?.company_motto || "Building the future, one project at a time.");
  const [tempSubtext, setTempSubtext] = useState(profile?.company_subtext || "Delivering excellence through innovation and dedication.");

  // Update temp values when profile loads
  useEffect(() => {
    if (profile?.company_motto) {
      setTempMotto(profile.company_motto);
    }
    if (profile?.company_subtext) {
      setTempSubtext(profile.company_subtext);
    }
  }, [profile?.company_motto, profile?.company_subtext]);

  const handleSaveMotto = async () => {
    const success = await updateCompanyMotto(tempMotto);
    if (success) {
      setIsEditingMotto(false);
    }
  };

  const handleCancelMotto = () => {
    setTempMotto(profile?.company_motto || "Building the future, one project at a time.");
    setIsEditingMotto(false);
  };

  const handleSaveSubtext = async () => {
    const success = await updateCompanySubtext(tempSubtext);
    if (success) {
      setIsEditingSubtext(false);
    }
  };

  const handleCancelSubtext = () => {
    setTempSubtext(profile?.company_subtext || "Delivering excellence through innovation and dedication.");
    setIsEditingSubtext(false);
  };

  return (
    <Card className="relative overflow-hidden border-0 min-h-[300px] h-[20vh]">
      {/* Background Effects */}
      {isDarkMode ? (
        <DarkVeilBackground className="absolute inset-0" />
      ) : (
        <div className="absolute inset-0">
          <BackgroundBeams className="absolute inset-0" />
          {/* Light mode gradient overlay for better visibility */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/60 to-cyan-50/80" />
        </div>
      )}
      
      {/* Content */}
      <CardContent className="relative p-8 h-full flex flex-col items-center justify-center text-center backdrop-blur-sm">
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Company Motto */}
          <div className="space-y-2">
            {isEditingMotto ? (
              <div className="space-y-3">
                <Input
                  value={tempMotto}
                  onChange={(e) => setTempMotto(e.target.value)}
                  className={`text-3xl font-bold text-center bg-black/10 dark:bg-white/10 border-white/20 ${
                    isDarkMode 
                      ? 'text-white placeholder:text-white/60' 
                      : 'text-gray-900 placeholder:text-gray-600'
                  }`}
                  placeholder="Enter your company motto"
                />
                <div className="flex justify-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveMotto}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 border-green-500/30"
                    variant="outline"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelMotto}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 border-red-500/30"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group relative">
                <h2 className={`text-4xl font-bold leading-tight ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {profile?.company_motto || "Building the future, one project at a time."}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingMotto(true)}
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Company Subtext */}
          <div className="space-y-2">
            {isEditingSubtext ? (
              <div className="space-y-3">
                <Input
                  value={tempSubtext}
                  onChange={(e) => setTempSubtext(e.target.value)}
                  className={`text-xl text-center bg-black/10 dark:bg-white/10 border-white/20 ${
                    isDarkMode 
                      ? 'text-white/80 placeholder:text-white/50' 
                      : 'text-gray-700 placeholder:text-gray-500'
                  }`}
                  placeholder="Enter your company subtext"
                />
                <div className="flex justify-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveSubtext}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 border-green-500/30"
                    variant="outline"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelSubtext}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 border-red-500/30"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group relative">
                <p className={`text-2xl opacity-80 leading-relaxed ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>
                  {profile?.company_subtext || "Delivering excellence through innovation and dedication."}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingSubtext(true)}
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Wrapper component that implements WidgetProps interface
export default function CompanyMottoCard({ isDarkMode }: WidgetProps) {
  return <CompanyMottoCardContent isDarkMode={isDarkMode} />;
}
