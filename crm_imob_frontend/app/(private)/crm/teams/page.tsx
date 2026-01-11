"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { Users, Plus, Shield } from "lucide-react"
import api from "@/lib/axios"
import { toast } from "sonner"

interface Team {
  id: string
  name: string
  gestor?: { id: string; name: string }
  members?: { id: string; name: string; role: string }[]
}

interface ManagerOption {
  id: string
  name: string
  role: string
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [newTeam, setNewTeam] = useState("")
  const [managers, setManagers] = useState<ManagerOption[]>([])
  const [managerChoice, setManagerChoice] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchTeamsAndManagers = async () => {
      try {
        setLoading(true)
        const teamsRes = await api.get('/teams')
        setTeams((teamsRes?.data?.data || []).map((t: { id: string; name: string; gestor?: { id: string; name: string }; membros?: Array<{ id: string; name: string; role: string }> }) => ({
          id: t.id,
          name: t.name,
          gestor: t.gestor ? { id: t.gestor.id, name: t.gestor.name } : undefined,
          members: (t.membros || []).map((m) => ({ id: m.id, name: m.name, role: m.role }))
        })))

        try {
          const managersRes = await api.get('/teams/managers')
          setManagers((managersRes?.data?.data || []).map((m: { id: string; name: string; role: string }) => ({
            id: m.id,
            name: m.name,
            role: m.role
          })))
        } catch (err) {
          console.warn('Gestores não carregados', err)
        }
      } catch (e) {
        console.error('Failed to load teams', e)
      } finally {
        setLoading(false)
      }
    }
    fetchTeamsAndManagers()
  }, [])

  const handleCreateTeam = () => {
    if (!newTeam.trim()) return
    const create = async () => {
      try {
        const { data } = await api.post('/teams', { name: newTeam.trim() })
        setTeams((prev) => [{ id: data.data.id, name: data.data.name, members: [] }, ...prev])
        setNewTeam("")
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao criar equipe'
        toast.error(msg)
      }
    }
    create()
  }

  const handleAssignManager = (teamId: string) => {
    const gestorId = managerChoice[teamId]
    if (!gestorId) return

    const assign = async () => {
      try {
        await api.post(`/teams/${teamId}/manager`, { gestorId })
        const selected = managers.find((m) => m.id === gestorId)
        setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, gestor: selected ? { id: selected.id, name: selected.name } : undefined } : t))
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao definir gestor'
        toast.error(msg)
      }
    }
    assign()
  }

  return (
    <PermissionGate
      requiredRole="GESTOR"
      fallback={
        <div className="p-6">
          <Card>
            <CardContent>
              <p className="text-sm text-slate-600">Apenas gestores ou administradores podem gerenciar equipes.</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Equipes</h1>
            <p className="text-slate-500 mt-1">Gerencie squads, gestores e corretores</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nome da equipe"
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              className="w-56"
            />
            <Button onClick={handleCreateTeam}>
              <Plus className="h-4 w-4 mr-2" />
              Criar equipe
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Equipes</CardTitle>
            <CardDescription>Distribua corretores por equipe e defina gestores.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Carregando...</p>
            ) : teams.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma equipe cadastrada.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {teams.map((team) => (
                  <Card key={team.id} className="border-slate-200">
                    <CardHeader className="flex-row items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <CardDescription>{team.gestor ? `Gestor: ${team.gestor.name}` : "Gestor não definido"}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {team.members?.length ?? 0} membros
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded-md px-3 py-2 text-sm"
                          value={managerChoice[team.id] || ""}
                          onChange={(e) => setManagerChoice((prev) => ({ ...prev, [team.id]: e.target.value }))}
                        >
                          <option value="">Selecionar gestor</option>
                          {managers.map((m) => (
                            <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                          ))}
                        </select>
                        <Button variant="outline" onClick={() => handleAssignManager(team.id)}>Definir gestor</Button>
                      </div>

                      {team.members && team.members.length > 0 ? (
                        <ul className="space-y-1 text-sm text-slate-700">
                          {team.members.map((member) => (
                            <li key={member.id} className="flex items-center gap-2">
                              <Shield className="h-3 w-3 text-slate-500" />
                              <span>{member.name}</span>
                              <Badge variant="outline" className="text-[11px]">
                                {member.role}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">Nenhum membro atribuído.</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  )
}
