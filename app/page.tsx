'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Ambulance, Flame, ShieldAlert, X, AlertTriangle } from 'lucide-react'
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
  Kay: 'rfa77d37dfeb'
} as const;

const PERSONA_IDS = {
  Ella: 'pf7ee746fd8a',
  Kay: 'pc86ba205bea'
} as const;

// First Aid Scenarios - maps scenario name to which avatar/persona to use
const FIRST_AID_SCENARIOS = {
  'CPR & Cardiac Arrest': { avatar: 'Ella', displayName: 'CPR & Cardiac Arrest' },
  'Severe Bleeding': { avatar: 'Kay', displayName: 'Severe Bleeding' },
  'Choking': { avatar: 'Ella', displayName: 'Choking' },
  'Burns': { avatar: 'Kay', displayName: 'Burns' },
  'Fractures': { avatar: 'Ella', displayName: 'Fractures' },
  'Shock': { avatar: 'Kay', displayName: 'Shock' },
} as const;

// Illustration mapping for different first aid scenarios
const ILLUSTRATION_SETS = {
  'CPR & Cardiac Arrest': [
    { id: 0, title: 'CPR Tutorial Video', video: 'https://www.youtube.com/embed/lKLb93wm6AM?autoplay=1&loop=1&playlist=lKLb93wm6AM&mute=1', description: 'Watch this complete CPR demonstration' },
    { id: 1, title: 'CPR Tutorial Video 2', video: 'https://www.youtube.com/embed/fZzVP2PqcGU?autoplay=1&loop=1&playlist=fZzVP2PqcGU&mute=1', description: 'Additional CPR training demonstration' },
    { id: 2, title: 'Step 1: Check Responsiveness', image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80', description: 'Tap shoulders and shout - Check if person responds' },
    { id: 3, title: 'Step 2: Call for Help', image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80', description: 'Call emergency services (193) immediately' },
    { id: 4, title: 'Step 3: Open Airway', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80', description: 'Tilt head back, lift chin to open airway' },
    { id: 5, title: 'Step 4: CPR - Compressions', image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&q=80', description: 'Push hard and fast - 30 compressions at center of chest' },
    { id: 6, title: 'Step 5: Rescue Breaths', image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&q=80', description: 'Give 2 rescue breaths - watch chest rise' },
    { id: 7, title: 'Step 6: Continue CPR', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80', description: 'Repeat 30:2 cycle until help arrives' },
  ],
  'Severe Bleeding': [
    { id: 0, title: 'Severe Bleeding Video 1', video: 'https://www.youtube.com/embed/kJSnso8T4qs?autoplay=1&loop=1&playlist=kJSnso8T4qs&mute=1', description: 'Learn how to control severe bleeding' },
    { id: 1, title: 'Severe Bleeding Video 2', video: 'https://www.youtube.com/embed/6_Ruqc8ZINc?autoplay=1&loop=1&playlist=6_Ruqc8ZINc&mute=1', description: 'Additional bleeding control techniques' },
    { id: 2, title: 'Severe Bleeding Video 3', video: 'https://www.youtube.com/embed/qlUhkuT7xmg?autoplay=1&loop=1&playlist=qlUhkuT7xmg&mute=1', description: 'More bleeding treatment methods' },
    { id: 3, title: 'Severe Bleeding Video 4', video: 'https://www.youtube.com/embed/SBVpal9c7dY?autoplay=1&loop=1&playlist=SBVpal9c7dY&mute=1', description: 'Advanced bleeding control' },
    { id: 4, title: 'Severe Bleeding Video 5', video: 'https://www.youtube.com/embed/iVhcW8Gsiq8?autoplay=1&loop=1&playlist=iVhcW8Gsiq8&mute=1', description: 'Emergency bleeding response' },
    { id: 5, title: 'Severe Bleeding Video 6', video: 'https://www.youtube.com/embed/raIJr1of3is?autoplay=1&loop=1&playlist=raIJr1of3is&mute=1', description: 'Pressure point techniques' },
    { id: 6, title: 'Severe Bleeding Video 7', video: 'https://www.youtube.com/embed/4aWJCiymkNI?autoplay=1&loop=1&playlist=4aWJCiymkNI&mute=1', description: 'Tourniquet application' },
    { id: 7, title: 'Severe Bleeding Video 8', video: 'https://www.youtube.com/embed/3oewdtTI9DY?autoplay=1&loop=1&playlist=3oewdtTI9DY&mute=1', description: 'Complete bleeding management guide' },
  ],
  'Choking': [
    { id: 0, title: 'Choking Tutorial Video', video: 'https://www.youtube.com/embed/Nz3-tMkU6d0?autoplay=1&loop=1&playlist=Nz3-tMkU6d0&mute=1', description: 'Watch how to help a choking person' },
    { id: 1, title: 'Choking Tutorial Video 2', video: 'https://www.youtube.com/embed/KkjLSo4YrXw?autoplay=1&loop=1&playlist=KkjLSo4YrXw&mute=1', description: 'Additional choking first aid techniques' },
    { id: 2, title: 'Choking Tutorial Video 3', video: 'https://www.youtube.com/embed/ZefcK-aXjLc?autoplay=1&loop=1&playlist=ZefcK-aXjLc&mute=1', description: 'More choking emergency response methods' },
    { id: 3, title: 'Step 1: Ask "Are You Choking?"', image: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&q=80', description: 'Check if person can speak or cough' },
    { id: 4, title: 'Step 2: Call for Help', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80', description: 'Have someone call emergency services' },
    { id: 5, title: 'Step 3: Give Back Blows', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80', description: 'Bend person forward, give 5 sharp blows between shoulder blades' },
    { id: 6, title: 'Step 4: Abdominal Thrusts', image: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=800&q=80', description: 'Stand behind, thrust inward and upward below ribcage' },
    { id: 7, title: 'Step 5: Repeat Cycle', image: 'https://images.unsplash.com/photo-1551601651-05d619b3f645?w=800&q=80', description: 'Alternate 5 back blows and 5 abdominal thrusts' },
    { id: 8, title: 'Step 6: CPR if Unconscious', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80', description: 'Start CPR if person becomes unconscious' },
  ],
  'Burns': [
    { id: 0, title: 'Burns Treatment Video', video: 'https://www.youtube.com/embed/IAiafkqb7nA?autoplay=1&loop=1&playlist=IAiafkqb7nA&mute=1', description: 'Watch how to treat burns properly' },
    { id: 1, title: 'Step 1: Stop Burning Process', image: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=800&q=80', description: 'Remove from heat source, extinguish flames' },
    { id: 2, title: 'Step 2: Cool the Burn', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', description: 'Run cool (not cold) water over burn for 10-20 minutes' },
    { id: 3, title: 'Step 3: Remove Jewelry/Clothing', image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80', description: 'Remove before swelling occurs (if not stuck)' },
    { id: 4, title: 'Step 4: Cover the Burn', image: 'https://images.unsplash.com/photo-1603398938939-e55c8c6b9c3d?w=800&q=80', description: 'Use sterile, non-stick dressing' },
    { id: 5, title: 'Step 5: Pain Management', image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80', description: 'Give over-the-counter pain reliever if appropriate' },
    { id: 6, title: 'Step 6: Seek Medical Help', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80', description: 'Get medical attention for serious burns' },
  ],
  'Fractures': [
    { id: 0, title: 'Fracture Treatment Video', video: 'https://www.youtube.com/embed/_egnX98lF_M?autoplay=1&loop=1&playlist=_egnX98lF_M&mute=1', description: 'Learn how to treat fractures and broken bones' },
    { id: 1, title: 'Step 1: Assess the Injury', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80', description: 'Check for deformity, swelling, severe pain' },
    { id: 2, title: 'Step 2: Call for Help', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80', description: 'Call emergency services for serious fractures' },
    { id: 3, title: 'Step 3: Immobilize the Area', image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=80', description: 'Prevent movement of injured area' },
    { id: 4, title: 'Step 4: Apply Splint', image: 'https://images.unsplash.com/photo-1599045118108-bf9954418b76?w=800&q=80', description: 'Use rigid materials to support the injury' },
    { id: 5, title: 'Step 5: Apply Ice', image: 'https://images.unsplash.com/photo-1610349781661-c0863e141be2?w=800&q=80', description: 'Ice pack wrapped in cloth to reduce swelling' },
    { id: 6, title: 'Step 6: Treat for Shock', image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800&q=80', description: 'Keep person warm and lying down' },
  ],
  'Shock': [
    { id: 0, title: 'Shock Treatment Video', video: 'https://www.youtube.com/embed/byrt0f3kvVE?autoplay=1&loop=1&playlist=byrt0f3kvVE&mute=1', description: 'Learn how to treat shock in emergencies' },
    { id: 1, title: 'Step 1: Call Emergency Services', image: 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=800&q=80', description: 'Call 193 immediately for medical emergency' },
    { id: 2, title: 'Step 2: Lay Person Down', image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800&q=80', description: 'Position flat on back with legs elevated 12 inches' },
    { id: 3, title: 'Step 3: Keep Warm', image: 'https://images.unsplash.com/photo-1621892613780-a8f2e6b0c6f4?w=800&q=80', description: 'Cover with blanket to maintain body temperature' },
    { id: 4, title: 'Step 4: Do Not Give Food/Drink', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80', description: 'Nothing by mouth, even if person is thirsty' },
    { id: 5, title: 'Step 5: Monitor Breathing', image: 'https://images.unsplash.com/photo-1615461066159-fea0960485d5?w=800&q=80', description: 'Check breathing and pulse regularly' },
    { id: 6, title: 'Step 6: Reassure the Person', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80', description: 'Stay calm and provide comfort until help arrives' },
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
  createVideoCall: async (avatar: string, scenario: string, language: string, name: string) => {
    try {
      const response = await axios.post('/api/tavus', {
        replica_id: REPLICA_IDS[avatar as keyof typeof REPLICA_IDS],
        persona_id: PERSONA_IDS[avatar as keyof typeof PERSONA_IDS],
        conversation_name: `${name}'s ${scenario} First Aid Session with ${avatar}`,
        conversational_context: `This is a first aid training conversation in ${language}. The user ${name} needs help with ${scenario}. You are ${avatar}, a trained first aid instructor. Guide them through the steps clearly and calmly. Start by saying "Hello ${name}, I'm here to help you with ${scenario}. Let's go through this step by step."`
      });
      
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
  const [selectedScenario, setSelectedScenario] = useState('')
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [videoCallUrl, setVideoCallUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeView, setActiveView] = useState<'video' | 'illustrations'>('video')

  const handleScenarioSubmit = async (avatar: string, scenario: string, language: string, name: string) => {
    setIsLoading(true)
    setSelectedScenario(scenario)
    try {
      const response = await TavusAPI.createVideoCall(avatar, scenario, language, name)
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
              <ScenarioSelection onSubmit={handleScenarioSubmit} />
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
                          <IllustrationCarouselFullscreen scenario={selectedScenario || 'CPR & Cardiac Arrest'} />
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

const scenarios = Object.keys(FIRST_AID_SCENARIOS);
const avatars = ['Ella', 'Kay'];

function ScenarioSelection({ onSubmit }: { onSubmit: (avatar: string, scenario: string, language: string, name: string) => void }) {
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [selectedScenario, setSelectedScenario] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('english')
  const [userName, setUserName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedAvatar && selectedScenario && userName.trim()) {
      onSubmit(selectedAvatar, selectedScenario, selectedLanguage, userName)
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
              First Aid Training
            </CardTitle>
            <p className="text-center text-gray-500 font-medium">Select the emergency scenario you need help with</p>
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
                    <SelectValue placeholder="Select Instructor" />
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
                <Select onValueChange={setSelectedScenario}>
                  <SelectTrigger className="w-full rounded-full bg-gray-50 border-gray-200 px-6 py-5 focus:ring-pink-500 focus:border-pink-500 transition-all hover:bg-pink-50 text-gray-900">
                    <SelectValue placeholder="Select Emergency Scenario" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-gray-200 shadow-lg max-h-[300px]">
                    {scenarios.map((scenario) => (
                      <SelectItem 
                        key={scenario} 
                        value={scenario}
                        className="focus:bg-pink-50 focus:text-pink-900 cursor-pointer"
                      >
                        {scenario}
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
function IllustrationCarouselFullscreen({ scenario }: { scenario: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const illustrations = ILLUSTRATION_SETS[scenario as keyof typeof ILLUSTRATION_SETS] || ILLUSTRATION_SETS['CPR & Cardiac Arrest'];

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
          {/* Check if it's a video or image */}
          {(illustrations[currentStep] as any).video ? (
            // YouTube Video Embed
            <iframe
              src={(illustrations[currentStep] as any).video}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={illustrations[currentStep].title}
            />
          ) : (
            // Full-size Image
            <img
              src={(illustrations[currentStep] as any).image}
              alt={illustrations[currentStep].title}
              className="w-full h-full object-fill"
              onError={(e) => {
                // Fallback to placeholder if image doesn't exist
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"%3E%3Crect fill="%23f3f4f6" width="1200" height="800"/%3E%3Ctext fill="%23ec4899" font-size="32" font-family="Arial" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"%3E' + illustrations[currentStep].title + '%3C/text%3E%3C/svg%3E';
              }}
            />
          )}
          
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
              className="w-12 h-12 rounded-full bg-[#3e3e42] hover:bg-[#4e4e52] text-white shadow-sm transition-all hover:-translate-y-1 flex flex-col items-center justify-center p-2 border border-[#5a5a5a]"
              title="Call Ambulance - 193"
            >
              <Ambulance className="text-white" size={48} strokeWidth={2} />
            </Button>
            
            <Button
              onClick={() => handleEmergencyCall('fire')}
              className="w-12 h-12 rounded-full bg-[#3e3e42] hover:bg-[#4e4e52] text-white shadow-sm transition-all hover:-translate-y-1 flex flex-col items-center justify-center p-2 border border-[#5a5a5a]"
              title="Call Fire Service - 192"
            >
              <Flame className="text-white" size={48} strokeWidth={2} />
            </Button>

            <Button
              onClick={() => handleEmergencyCall('police')}
              className="w-12 h-12 rounded-full bg-[#3e3e42] hover:bg-[#4e4e52] text-white shadow-sm transition-all hover:-translate-y-1 flex flex-col items-center justify-center p-2 border border-[#5a5a5a]"
              title="Call Police - 191"
            >
              <ShieldAlert className="text-white" size={48} strokeWidth={2} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-12 h-12 rounded-full shadow-sm transition-all hover:-translate-y-1 flex items-center justify-center bg-[#3e3e42] hover:bg-[#4e4e52] text-white border border-[#5a5a5a]"
        title={isExpanded ? "Close Emergency Menu" : "Emergency Services"}
      >
        {isExpanded ? (
          <X size={48} strokeWidth={2} />
        ) : (
          <AlertTriangle className="text-white" size={48} strokeWidth={2} />
        )}
      </Button>
    </div>
  );
}