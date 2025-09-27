'use client'

import {
  VerticalStep,
  VerticalStepContent,
  VerticalStepFooter,
  VerticalStepHeader,
  VerticalStepHeaderDescription,
  VerticalStepHeaderTitle,
  VerticalStepPreviousButton,
  VerticalStepSubmitButton,
} from '@/components/ui/form-step'
import { InvitationInput } from '@/modules/invitation'

const MAX_ONBOARDING_INVITES = 10

export interface OrganizationOnboardingFormInviteTeamStepProps {
  step: string
}

export function OrganizationOnboardingFormInviteTeamStep({
  step,
}: OrganizationOnboardingFormInviteTeamStepProps) {
  return (
    <VerticalStep step={step}>
      <VerticalStepHeader>
        <VerticalStepHeaderTitle>Invite your team</VerticalStepHeaderTitle>
        <VerticalStepHeaderDescription>
          Add team members to collaborate on your workspace.
        </VerticalStepHeaderDescription>
      </VerticalStepHeader>

      <VerticalStepContent>
        <div className="space-y-4">
          <InvitationInput maxInvites={MAX_ONBOARDING_INVITES} />

          <p className="text-sm text-muted-foreground mt-4">
            Invited members will receive an email with instructions to access
            the platform.
          </p>
        </div>
      </VerticalStepContent>

      <VerticalStepFooter>
        <VerticalStepPreviousButton />
        <VerticalStepSubmitButton>Next</VerticalStepSubmitButton>
      </VerticalStepFooter>
    </VerticalStep>
  )
}
