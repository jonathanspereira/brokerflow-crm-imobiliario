import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const name = 'Jonathan Pereira'
  const email = 'jonathanpereira.jsp@outlook.com'
  const password = 'rX6+T@US+f;v2=D'

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Usuário já existe, atualizando para SUPER_ADMIN...')
    await prisma.user.update({
      where: { email },
      data: { role: Role.SUPER_ADMIN }
    })
    console.log('✅ Usuário atualizado para SUPER_ADMIN')
    return
  }

  // Create agency for super admin
  const agencia = await prisma.agencia.create({
    data: {
      name: 'Admin Agency'
    }
  })

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create super admin user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      agenciaId: agencia.id
    }
  })

  console.log('✅ SUPER_ADMIN criado com sucesso!')
  console.log('Email:', user.email)
  console.log('Nome:', user.name)
  console.log('Role:', user.role)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
