"use client"

import { useSubscriptionStatus } from "@/hooks/usePermissions"
import { AlertTriangle, CreditCard, XCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function SubscriptionAlert() {
  const subscription = useSubscriptionStatus()

  // Don't show any payment alerts for lifetime access users
  if (subscription.hasLifetimeAccess) {
    return null
  }

  if (!subscription.needsPayment) {
    // Show trial warning when less than 7 days left
    if (subscription.isTrial && subscription.trialDaysLeft > 0 && subscription.trialDaysLeft <= 7) {
      return (
        <Alert className="border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Período de teste terminando</AlertTitle>
          <AlertDescription className="text-amber-800">
            Seu período de teste termina em {subscription.trialDaysLeft} {subscription.trialDaysLeft === 1 ? 'dia' : 'dias'}.{' '}
            <Link href="/crm/billing" className="font-semibold underline">
              Assine agora
            </Link>{' '}
            para continuar usando o BrokerFlow.
          </AlertDescription>
        </Alert>
      )
    }

    return null
  }

  if (subscription.isCanceled) {
    return (
      <Alert className="border-red-500 bg-red-50">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-900">Assinatura cancelada</AlertTitle>
        <AlertDescription className="text-red-800 flex items-center justify-between">
          <span>
            Sua assinatura foi cancelada. Reative sua conta para continuar usando o sistema.
          </span>
          <Link href="/crm/billing">
            <Button size="sm" className="ml-4">
              Reativar conta
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  if (subscription.isOverdue) {
    return (
      <Alert className="border-red-500 bg-red-50">
        <CreditCard className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-900">Pagamento pendente</AlertTitle>
        <AlertDescription className="text-red-800 flex items-center justify-between">
          <span>
            Existe um pagamento pendente. Regularize sua situação para continuar usando o sistema.
          </span>
          <Link href="/crm/billing">
            <Button size="sm" className="ml-4">
              Ver faturas
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  if (subscription.isTrial && subscription.trialDaysLeft <= 0) {
    return (
      <Alert className="border-red-500 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-900">Período de teste expirado</AlertTitle>
        <AlertDescription className="text-red-800 flex items-center justify-between">
          <span>
            Seu período de teste expirou. Assine agora para continuar usando o BrokerFlow.
          </span>
          <Link href="/crm/billing">
            <Button size="sm" className="ml-4">
              Assinar agora
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
