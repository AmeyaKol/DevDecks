import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AcademicCapIcon, 
  BookOpenIcon, 
  CodeBracketIcon,
  ClockIcon,
  SparklesIcon,
  UserGroupIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  MoonIcon,
  SunIcon,
  DocumentTextIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import useFlashcardStore from '../store/flashcardStore';

const LandingPage = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useFlashcardStore();

  const features = [
    {
      icon: ClockIcon,
      title: 'EOD Revision',
      description: 'Review all cards created in the last 24 hours. Never forget what you learned today.',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      icon: PlayIcon,
      title: 'Study Mode with Videos',
      description: 'Watch embedded YouTube videos, take notes, add clickable timestamps, and write code - all in one place.',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    },
    {
      icon: BookOpenIcon,
      title: 'YouTube Playlist Import',
      description: 'Automatically create decks from any YouTube playlist with embedded videos for seamless learning.',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      icon: UserGroupIcon,
      title: 'User Profiles & Tracking',
      description: 'Track created decks, favorites, recent activity, and completed LeetCode problems in one dashboard.',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      icon: MagnifyingGlassIcon,
      title: 'Advanced Search & Filtering',
      description: 'Powerful search with deck and card views. Filter by type, tags, difficulty, and more.',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    {
      icon: MoonIcon,
      title: 'Dark Mode',
      description: 'Easy on the eyes with a beautiful dark mode for late-night study sessions.',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
    }
  ];

  const dsaFeatures = [
    {
      icon: ChartBarIcon,
      title: 'Comprehensive Problem List',
      description: 'Updated list with company tags, numeric difficulty ratings, and problem categorization.',
      highlight: '1000+ Problems'
    },
    {
      icon: CodeBracketIcon,
      title: 'Multi-Language Support',
      description: 'Code editor with syntax highlighting for Python, Java, C++, and JavaScript.',
      highlight: '4 Languages'
    },
    {
      icon: DocumentTextIcon,
      title: 'Smart Categorization',
      description: 'Organize problems by patterns, companies, difficulty, and custom tags.',
      highlight: 'Smart Tags'
    }
  ];

  const greFeatures = [
    {
      icon: AcademicCapIcon,
      title: 'Pre-built GRE Decks',
      description: '10+ curated decks with 300+ words and multiple-choice questions.',
      count: '300+ Words'
    },
    {
      icon: BookOpenIcon,
      title: 'Dictionary Integration',
      description: 'Merriam-Webster API integration for instant word definitions and examples.',
      count: 'Auto-create'
    },
    {
      icon: LightBulbIcon,
      title: 'Vocabulary Builder',
      description: 'Automatically create flashcards with definitions, pronunciation, and usage.',
      count: 'Smart Learn'
    }
  ];

  const cardTypes = [
    { name: 'DSA', color: 'bg-blue-500' },
    { name: 'System Design', color: 'bg-purple-500' },
    { name: 'Behavioral', color: 'bg-green-500' },
    { name: 'Technical Knowledge', color: 'bg-yellow-500' },
    { name: 'GRE-Word', color: 'bg-red-500' },
    { name: 'GRE-MCQ', color: 'bg-pink-500' }
  ];

  const stats = [
    { label: 'Flashcard Types', value: '6+' },
    { label: 'Pre-built Decks', value: '15+' },
    { label: 'LeetCode Problems', value: '1000+' },
    { label: 'GRE Words', value: '300+' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                DevDecks
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <SunIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              
              <Button variant="outline" onClick={() => navigate('/home')}>
                Go to App
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <Badge variant="secondary" className="text-sm px-4 py-2">
            ✨ All-in-One Learning Platform
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            Master CS Interviews with Intelligent Flashcards
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            The ultimate platform for CS students and developers to master DSA, System Design, GRE, and more through 
            customizable, interactive flashcards with embedded videos and smart study tools.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate('/home')}
            >
              Get Started Free
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => navigate('/problem-list')}
            >
              Explore Problems
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Card Types */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap justify-center gap-3">
          {cardTypes.map((type) => (
            <Badge
              key={type.name}
              className={`${type.color} text-white text-sm px-4 py-2 hover:opacity-80 transition-opacity`}
            >
              {type.name}
            </Badge>
          ))}
        </div>
      </section>

      {/* Main Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Features for Effective Learning
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Everything you need to ace your technical interviews
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-xl transition-shadow duration-300 border-2">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* DSA Features */}
      <section className="bg-white/50 dark:bg-gray-800/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="info" className="mb-4">DSA Mastery</Badge>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Built for LeetCode & Interview Prep
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Comprehensive tools to track and master coding problems
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {dsaFeatures.map((feature) => (
              <Card key={feature.title} className="text-center hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <Badge variant="success" className="mb-3">{feature.highlight}</Badge>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* GRE Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Badge variant="warning" className="mb-4">GRE Preparation</Badge>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ace Your GRE Vocabulary
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Pre-built decks and smart tools for vocabulary building
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {greFeatures.map((feature) => (
            <Card key={feature.title} className="text-center hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                <Badge variant="secondary" className="mb-3">{feature.count}</Badge>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Additional Features Highlight */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-8">
              And Much More...
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Testing Mode</h3>
                  <p className="text-indigo-100">Quiz yourself with different question formats</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Public/Private Decks</h3>
                  <p className="text-indigo-100">Share your knowledge or keep it private</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Favorites System</h3>
                  <p className="text-indigo-100">Bookmark important decks for quick access</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Code Snippets</h3>
                  <p className="text-indigo-100">Store and organize your solutions with syntax highlighting</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Progress Tracking</h3>
                  <p className="text-indigo-100">Monitor completed problems and study streaks</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Mobile Friendly</h3>
                  <p className="text-indigo-100">Study anywhere with responsive design</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-2 border-indigo-200 dark:border-indigo-800">
          <CardContent className="text-center py-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Level Up Your Interview Prep?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of students and developers who are mastering technical interviews with DevDecks.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="xl"
                onClick={() => navigate('/home')}
                className="text-lg"
              >
                Start Learning Now
                <SparklesIcon className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="xl" 
                variant="outline"
                onClick={() => navigate('/about')}
                className="text-lg"
              >
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">DevDecks</span>
              </div>
              <p className="text-sm">
                Your all-in-one platform for mastering technical interviews.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/home" className="hover:text-white transition-colors">Flashcards</a></li>
                <li><a href="/problem-list" className="hover:text-white transition-colors">Problem List</a></li>
                <li><a href="/test" className="hover:text-white transition-colors">Testing Mode</a></li>
                <li><a href="/study" className="hover:text-white transition-colors">Study Mode</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="/changelog" className="hover:text-white transition-colors">Changelog</a></li>
                <li><a href="/home?tab=content&view=decks&type=gre-mcq" className="hover:text-white transition-colors">GRE Decks</a></li>
                <li><a href="/home?tab=content&view=decks&type=dsa" className="hover:text-white transition-colors">DSA Decks</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} DevDecks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

