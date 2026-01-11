import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'jonathanpereira.1998.jsp@gmail.com'

  const user = await prisma.user.findUnique({ where: { email } })
  
  if (!user) {
    console.log(`❌ Usuário ${email} não encontrado!`)
    return
  }

  if (user.lifetimeAccess) {
    console.log(`ℹ️  Usuário ${email} já possui acesso vitalício!`)
    console.log('Email:', user.email)
    console.log('Nome:', user.name)
    console.log('Role:', user.role)
    console.log('Acesso Vitalício: ✅ SIM')
    return
  }

  // Grant lifetime access
  await prisma.user.update({
    where: { email },
    data: { lifetimeAccess: true }
  })

  console.log('✅ Acesso vitalício concedido com sucesso!')
  console.log('Email:', user.email)
  console.log('Nome:', user.name)
  console.log('Role:', user.role)
  console.log('Acesso Vitalício: ✅ ATIVADO')
  console.log('\n🎉 Este usuário agora tem acesso ilimitado sem verificações de assinatura!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
