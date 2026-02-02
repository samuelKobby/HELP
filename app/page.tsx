'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion';

// Add interfaces
interface ConversationResponse {
  conversation_id: string;
  conversation_name: string;
  status: string;
  conversation_url: string;
  replica_id: string;
  persona_id: string;
  created_at: string;
}

const TAVUS_API_KEY = process.env.TAVUS_API_KEY
const REPLICA_IDS = {
  Ella: 'rfb51183fe',
  // rfb51183fe
  Kay: 'rfa77d37dfeb'
  // rfa77d37dfeb
} as const;

const PERSONA_IDS = {
  Ella: 'pf7ee746fd8a',
  // pa33088155d1
  Kay: 'pc86ba205bea'
  // p0d33655e5df
} as const;

// Illustration mapping for different first aid scenarios
// Using real images from publicly available sources
const ILLUSTRATION_SETS = {
  Ella: [
    { id: 1, title: 'Step 1: Check Responsiveness', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80', description: 'Tap shoulders and shout - Check if person responds' },
    { id: 2, title: 'Step 2: Call for Help', image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&q=80', description: 'Call emergency services (193) immediately' },
    { id: 3, title: 'Step 3: Open Airway', image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&q=80', description: 'Tilt head back, lift chin to open airway' },
    { id: 4, title: 'Step 4: CPR - Compressions', image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80', description: 'Push hard and fast - 30 compressions at center of chest' },
    { id: 5, title: 'Step 5: Rescue Breaths', image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80', description: 'Give 2 rescue breaths - watch chest rise' },
    { id: 6, title: 'Step 6: Continue CPR', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80', description: 'Repeat 30:2 cycle until help arrives' },
  ],
  Kay: [
    { id: 1, title: 'Step 1: Apply Direct Pressure', image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&q=80', description: 'Press firmly on wound with clean cloth' },
    { id: 2, title: 'Step 2: Elevate Injury', image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&q=80', description: 'Raise injured area above heart level' },
    { id: 3, title: 'Step 3: Keep Pressure', image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80', description: 'Maintain firm pressure for 10-15 minutes' },
    { id: 4, title: 'Step 4: Bandage Wound', image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&q=80', description: 'Wrap bandage firmly but not too tight' },
    { id: 5, title: 'Step 5: Monitor Circulation', image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80', description: 'Check fingers/toes for warmth and color' },
    { id: 6, title: 'Step 6: Watch for Shock', image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80', description: 'Keep patient warm and lying down' },
  ],
} as const;

// Add languages array
const languages = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Español' },
  { value: 'french', label: 'Français' },
  { value: 'german', label: 'Deutsch' },
  { value: 'italian', label: 'Italiano' },
  { value: 'portuguese', label: 'Português' },
  { value: 'japanese', label: '日本語' },
  { value: 'korean', label: '한국어' },
  { value: 'mandarin', label: '中文' },
  { value: 'hindi', label: 'हिन्दी' },
];

// Add these color mappings near the top with other constants
const AVATAR_COLORS = {
  Alice: 'blue',
  Brian: 'purple',
  Greg: 'orange'
} as const;

const USECASE_COLORS = {
  Doctor: 'green',
  Therapist: 'blue',
  Mechanic: 'red',
  'Personal Trainer': 'orange',
  Tutor: 'indigo'
} as const;

// Add these color mapping functions
const getAvatarColorClasses = (avatar: string) => {
  const colorMap = {
    Alice: 'bg-blue-100 text-blue-500 text-blue-700',
    Brian: 'bg-purple-100 text-purple-500 text-purple-700',
    Greg: 'bg-orange-100 text-orange-500 text-orange-700'
  };
  return colorMap[avatar as keyof typeof colorMap] || 'bg-pink-100 text-pink-500 text-pink-700';
};

const getUseCaseColorClasses = (useCase: string) => {
  const colorMap = {
    Doctor: 'bg-green-100 text-green-500 text-green-700',
    Therapist: 'bg-blue-100 text-blue-500 text-blue-700',
    Mechanic: 'bg-red-100 text-red-500 text-red-700',
    'Personal Trainer': 'bg-orange-100 text-orange-500 text-orange-700',
    Tutor: 'bg-indigo-100 text-indigo-500 text-indigo-700'
  };
  return colorMap[useCase as keyof typeof colorMap] || 'bg-pink-100 text-pink-500 text-pink-700';
};

// Replace the TavusAPI implementation
const TavusAPI = {
  createVideoCall: async (avatar: string, useCase: string, language: string, name: string) => {
    try {
      const response = await axios.post('/api/tavus', {
        replica_id: REPLICA_IDS[avatar as keyof typeof REPLICA_IDS],
        persona_id: PERSONA_IDS[useCase as keyof typeof PERSONA_IDS],
        conversation_name: `${name}'s conversation with ${avatar} as ${useCase}`,
        conversational_context: `This is a conversation in ${language} between the user${name} and you, ${avatar}, who is acting as a ${useCase}. Start by saying "Hello ${name}!" first.`
      });
//change conversational context to be API based?
//convert csv to text?
      return { 
        id: response.data.conversation_id, 
        url: response.data.conversation_url 
      };
    } catch (error: any) {
      console.error('Full error response:', error.response?.data);
      throw error;
    }
  }
};

// Add these animation variants near other constants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: "tween" as const,
  ease: "anticipate" as const,
  duration: 0.5
};

// Add this new component near the top of the file
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white z-10" />
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute h-[40vh] w-[1px] bg-gradient-to-b from-transparent via-pink-500/50 to-transparent"
          style={{
            left: `${15 + i * 20}%`,
            animation: `moveVertical ${8 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`
          }}
        />
      ))}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute h-[1px] w-[40vw] bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"
          style={{
            top: `${15 + i * 20}%`,
            animation: `moveHorizontal ${8 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes moveVertical {
          0%, 100% { transform: translateY(-50%); }
          50% { transform: translateY(100%); }
        }
        @keyframes moveHorizontal {
          0%, 100% { transform: translateX(-50%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// Create a new Layout component at the top level
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <button 
        onClick={() => window.location.reload()}
        className="group fixed bottom-4 left-4 z-50 h-7 w-7 hover:w-auto rounded-full bg-[#3e3e42] hover:bg-[#4e4e52] flex items-center justify-start pl-1.5 pr-1.5 hover:pr-2.5 transition-all duration-300 ease-in-out overflow-hidden border border-[#5a5a5a] shadow-sm"
      >
        <svg className="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
        <span className="text-white text-xs font-normal whitespace-nowrap ml-0 group-hover:ml-1.5 max-w-0 group-hover:max-w-[80px] opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
          Home
        </span>
      </button>
      
      <EmergencyButtons />
      
      {children}
    </div>
  )
}

export default function Home() {
  const [isStarted, setIsStarted] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [selectedUseCase, setSelectedUseCase] = useState('')
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [videoCallUrl, setVideoCallUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeView, setActiveView] = useState<'video' | 'illustrations'>('video')

  const handleAvatarSubmit = async (avatar: string, useCase: string, language: string, name: string) => {
    setIsLoading(true)
    setSelectedAvatar(avatar)
    setSelectedUseCase(useCase)
    try {
      const response = await TavusAPI.createVideoCall(avatar, useCase, language, name)
      setVideoCallUrl(response.url)
      setShowVideoCall(true)
    } catch (error) {
      console.error('Error creating video call:', error)
      alert('Failed to create video call. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        {!isStarted ? (
          <motion.div
            key="welcome"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="relative z-10"
          >
            <div className="min-h-screen">
              <WelcomeScreen onStart={() => setIsStarted(true)} />
            </div>
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key="loading"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="relative z-10"
          >
            <div className="min-h-screen">
              <LoadingScreenWithoutLogo />
            </div>
          </motion.div>
        ) : !showVideoCall ? (
          <motion.div
            key="avatar"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="relative z-10"
          >
            <div className="min-h-screen">
              <AvatarSelectionWithoutLogo onSubmit={handleAvatarSubmit} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="video"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="relative z-10"
          >
            <div className="min-h-screen">
              <div className="flex items-center justify-center min-h-screen p-2 md:p-4">
                <div className="relative w-full max-w-[98vw] lg:max-w-[95vw] xl:max-w-[98vw]">
                  <div className="absolute inset-0 bg-pink-500/30 rounded-3xl filter blur-3xl"></div>
                  <Card className="relative w-full h-[96vh] shadow-2xl bg-white/90 backdrop-blur-sm border border-gray-200/50">
                    <CardContent className="p-0 w-full h-full bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:shadow-[0_8px_30px_rgb(236,72,153,0.3)]">
                      {/* Content Area - Full Height */}
                      <div className="h-full overflow-hidden relative">
                        {/* View Toggle Buttons - Floating on top */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/40 backdrop-blur-md rounded-full p-1.5">
                          <button
                            onClick={() => setActiveView('video')}
                            className={`p-2.5 rounded-full transition-all ${
                              activeView === 'video'
                                ? 'bg-pink-500 text-white shadow-lg'
                                : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                            title="Video Call"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setActiveView('illustrations')}
                            className={`p-2.5 rounded-full transition-all ${
                              activeView === 'illustrations'
                                ? 'bg-pink-500 text-white shadow-lg'
                                : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                            title="Visual Guide"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Video View - Always mounted, hidden when not active */}
                        <div
                          className={`absolute inset-0 transition-opacity duration-300 ${
                            activeView === 'video' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                          }`}
                        >
                          <div className="bg-gray-900 rounded-xl overflow-hidden h-full">
                            <iframe 
                              src={videoCallUrl} 
                              className="w-full h-full" 
                              allow="camera; microphone"
                            />
                          </div>
                        </div>

                        {/* Illustrations View - Always mounted, hidden when not active */}
                        <div
                          className={`absolute inset-0 transition-opacity duration-300 ${
                            activeView === 'illustrations' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                          }`}
                        >
                          <IllustrationCarouselFullscreen useCase={selectedUseCase || 'Ella'} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <EmergencyButtons />
    </Layout>
  )
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div id="welcome-screen" className="min-h-screen">
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md shadow-[0_8px_40px_-12px_rgba(236,72,153,0.5)] border border-gray-100 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <div className="h-4" />
            <div className="flex flex-col items-center justify-center mb-4">
              <img src="/tavus2.png" alt="Tavus Logo" className="w-50" />
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-pink-200 to-transparent mt-4" />
            </div>
            <div className="h-2" />
            
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              First Aid 1.0
            </CardTitle>
            <p className="text-sm text-center text-gray-500 font-medium mb-4">
              Your Emergency Assistant
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={onStart}
              className="w-full bg-pink-500 hover:bg-pink-600 rounded-full py-2 text-base font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const avatars = ['Ella', 'Kay']
const useCases = ['Ella', 'Kay']

function AvatarSelectionWithoutLogo({ onSubmit }: { onSubmit: (avatar: string, useCase: string, language: string, name: string) => void }) {
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [selectedUseCase, setSelectedUseCase] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('english')
  const [userName, setUserName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedAvatar && selectedUseCase && userName.trim()) {
      onSubmit(selectedAvatar, selectedUseCase, selectedLanguage, userName)
    } else {
      alert('Please fill in all fields')
    }
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md shadow-[0_8px_40px_-12px_rgba(236,72,153,0.5)] border border-gray-100 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Create Your Video Call
            </CardTitle>
            <p className="text-center text-gray-500 font-medium">Select your preferences below</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative group">
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-full bg-gray-50 border-gray-200 px-6 py-5 focus:ring-pink-500 focus:border-pink-500 transition-all"
                />
                <div className="absolute inset-0 rounded-full bg-pink-50 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
              </div>

              <div className="relative group">
                <Select onValueChange={setSelectedAvatar}>
                  <SelectTrigger className="w-full rounded-full bg-gray-50 border-gray-200 px-6 py-5 focus:ring-pink-500 focus:border-pink-500 transition-all hover:bg-pink-50">
                    <SelectValue placeholder="Select Avatar" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-gray-200 shadow-lg">
                    {avatars.map((avatar) => (
                      <SelectItem 
                        key={avatar} 
                        value={avatar}
                        className="focus:bg-pink-50 focus:text-pink-900 cursor-pointer"
                      >
                        {avatar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative group">
                <Select onValueChange={setSelectedUseCase}>
                  <SelectTrigger className="w-full rounded-full bg-gray-50 border-gray-200 px-6 py-5 focus:ring-pink-500 focus:border-pink-500 transition-all hover:bg-pink-50">
                    <SelectValue placeholder="Select Use Case" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-gray-200 shadow-lg">
                    {useCases.map((useCase) => (
                      <SelectItem 
                        key={useCase} 
                        value={useCase}
                        className="focus:bg-pink-50 focus:text-pink-900 cursor-pointer"
                      >
                        {useCase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative group">
                <Select defaultValue="english" onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-full rounded-full bg-gray-50 border-gray-200 px-6 py-5 focus:ring-pink-500 focus:border-pink-500 transition-all hover:bg-pink-50">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-gray-200 shadow-lg">
                    {languages.map((lang) => (
                      <SelectItem 
                        key={lang.value} 
                        value={lang.value}
                        className="focus:bg-pink-50 focus:text-pink-900 cursor-pointer"
                      >
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-pink-500 hover:bg-pink-600 rounded-full py-6 text-lg font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 mt-6"
              >
                Start Video Call
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoadingScreenWithoutLogo() {
  return (
    <div className="min-h-screen">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md shadow-[0_8px_40px_-12px_rgba(236,72,153,0.5)] border border-gray-100 bg-white/90 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="relative">
              <div className="w-16 h-16 bg-pink-500 rounded-full animate-ping absolute opacity-75"></div>
              <div className="w-16 h-16 bg-pink-500 rounded-full relative"></div>
            </div>
            <p className="mt-8 text-lg font-semibold text-gray-700">
              Creating your video call...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Fullscreen Illustration Carousel Component
function IllustrationCarouselFullscreen({ useCase }: { useCase: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const illustrations = ILLUSTRATION_SETS[useCase as keyof typeof ILLUSTRATION_SETS] || ILLUSTRATION_SETS.Ella;

  const handleNext = () => {
    setCurrentStep((prev) => (prev + 1) % illustrations.length);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => (prev - 1 + illustrations.length) % illustrations.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      handleNext();
    }
    if (touchStart - touchEnd < -75) {
      handlePrev();
    }
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden rounded-xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full"
        >
          {/* Full-size Image */}
          <img
            src={illustrations[currentStep].image}
            alt={illustrations[currentStep].title}
            className="w-full h-full object-fill"
            onError={(e) => {
              // Fallback to placeholder if image doesn't exist
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"%3E%3Crect fill="%23f3f4f6" width="1200" height="800"/%3E%3Ctext fill="%23ec4899" font-size="32" font-family="Arial" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"%3E' + illustrations[currentStep].title + '%3C/text%3E%3C/svg%3E';
            }}
          />
          
          {/* Top Gradient Overlay for Title */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent p-4 text-white">
            <h3 className="font-bold text-xl md:text-2xl">{illustrations[currentStep].title}</h3>
          </div>
          
          {/* Bottom Gradient Overlay for Description */}
          <div className="absolute bottom-14 left-0 right-0 p-4 pt-6 text-white">
            <p className="text-sm md:text-base opacity-95">{illustrations[currentStep].description}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Fixed Step Indicators at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white z-20">
        <div className="flex justify-center gap-2 mb-2">
          {illustrations.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-8 bg-white'
                  : 'w-1.5 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
        
        <div className="text-center text-xs md:text-sm opacity-90">
          Step {currentStep + 1} of {illustrations.length}
        </div>
      </div>

      {/* Navigation Buttons - Simple Transparent Icons */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-2 transition-all hover:scale-110 z-10"
        aria-label="Previous illustration"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-2 transition-all hover:scale-110 z-10"
        aria-label="Next illustration"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// Add this new component near the other component definitions
function EmergencyButtons() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEmergencyCall = (type: 'police' | 'fire' | 'ambulance') => {
    if (type === 'police') {
      window.open('tel:191', '_self');
    } else if (type === 'fire') {
      window.open('tel:192', '_self');
    } else if (type === 'ambulance') {
      window.open('tel:193', '_self');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="mb-4 space-y-3"
          >
            <Button
              onClick={() => handleEmergencyCall('ambulance')}
              className="w-16 h-16 rounded-full bg-[#3e3e42] hover:bg-[#4e4e52] text-white shadow-sm transition-all hover:-translate-y-1 flex flex-col items-center justify-center p-2 border border-[#5a5a5a]"
              title="Call Ambulance - 193"
            >
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                <rect x="7" y="5" width="6" height="2" fill="#ff4444"/>
                <rect x="9" y="3" width="2" height="6" fill="#ff4444"/>
              </svg>
            </Button>
            
            <Button
              onClick={() => handleEmergencyCall('fire')}
              className="w-16 h-16 rounded-full bg-[#3e3e42] hover:bg-[#4e4e52] text-white shadow-sm transition-all hover:-translate-y-1 flex flex-col items-center justify-center p-2 border border-[#5a5a5a]"
              title="Call Fire Service - 192"
            >
              <svg className="w-12 h-12" fill="#ff6b35" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
              </svg>
            </Button>

            <Button
              onClick={() => handleEmergencyCall('police')}
              className="w-16 h-16 rounded-full bg-[#3e3e42] hover:bg-[#4e4e52] text-white shadow-sm transition-all hover:-translate-y-1 flex flex-col items-center justify-center p-2 border border-[#5a5a5a]"
              title="Call Police - 191"
            >
              <svg className="w-12 h-12" fill="#4a90e2" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-16 h-16 rounded-full shadow-sm transition-all hover:-translate-y-1 flex items-center justify-center bg-[#3e3e42] hover:bg-[#4e4e52] text-white border border-[#5a5a5a]"
        title={isExpanded ? "Close Emergency Menu" : "Emergency Services"}
      >
        {isExpanded ? (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-12 h-12" fill="#ff4444" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
        )}
      </Button>
    </div>
  );
}