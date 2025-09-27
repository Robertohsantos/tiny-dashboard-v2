'use client'

import {
  Wand2,
  Calendar,
  BarChart3,
  Zap,
  MessageSquare,
  Link2,
} from 'lucide-react'

const FEATURES = [
  {
    title: 'AI Assistant',
    description:
      'Get AI-powered suggestions for your social media content. Our assistant helps you create engaging posts that resonate with your audience.',
    icon: Wand2,
  },
  {
    title: 'Smart Scheduling',
    description:
      'Schedule your posts at the optimal times for maximum engagement. Our AI analyzes your audience behavior to find the best posting times.',
    icon: Calendar,
  },
  {
    title: 'Analytics & Insights',
    description:
      'Track your performance with detailed analytics. Understand what works and optimize your strategy for better results.',
    icon: BarChart3,
  },
  {
    title: 'Automation Rules',
    description:
      'Set up rules to automatically post content based on triggers. Save time and maintain consistency across your social media presence.',
    icon: Zap,
  },
  {
    title: 'Multi-Platform Support',
    description:
      'Manage all your social media accounts from one place. Connect with Instagram, Twitter, LinkedIn, Facebook, and more.',
    icon: Link2,
  },
  {
    title: 'Team Collaboration',
    description:
      'Work together with your team. Assign roles, review content, and maintain brand consistency across all platforms.',
    icon: MessageSquare,
  },
] as const

export function SiteFeaturesSection() {
  return (
    <section className="py-20 px-4 bg-muted/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features for Social Media Success
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to create, schedule, and optimize your social
            media content
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-background p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <feature.icon className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
