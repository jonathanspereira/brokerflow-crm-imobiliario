import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const name = 'Jonathan Pereira'
  const email = 'jonathanpereira.1998.jsp@gmail.com'
  const password = 'rX6+T@US+f;v2=D' // Gere uma senha segura antes de usar

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`⚠️  Usuário ${email} já existe!`)
    console.log('Email:', existing.email)
    console.log('Nome:', existing.name)
    console.log('Role:', existing.role)
    return
  }

  // Create or get agency for autonomo
  let agencia = await prisma.agencia.findFirst({
    where: { name: 'Agência Padrão' }
  })

  if (!agencia) {
    agencia = await prisma.agencia.create({
      data: {
        name: 'Agência Padrão'
      }
    })
    console.log('✅ Agência padrão criada')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create autonomo user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.AUTONOMO,
      agenciaId: agencia.id
    }
  })

  console.log('✅ Usuário AUTONOMO criado com sucesso!')
  console.log('Email:', user.email)
  console.log('Nome:', user.name)
  console.log('Role:', user.role)
  console.log('Agência:', agencia.name)
  console.log('\n🔐 Credenciais:')
  console.log('Email: ' + user.email)
  console.log('Senha: ' + password)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
