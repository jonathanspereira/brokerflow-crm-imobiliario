/// <reference types="node" />
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function seedDocumentModels() {
  try {
    // Verificar se já existem modelos
    const existingModels = await prisma.documentModel.count()
    
    if (existingModels > 0) {
      console.log("✓ Modelos de documentos já existem no banco")
      return
    }

    // Criar modelos de exemplo
    const models = [
      {
        name: "Contrato de Venda Imóvel",
        content: `<h1>CONTRATO DE VENDA DE IMÓVEL</h1>
<p><strong>Data:</strong> {{data.hoje}}</p>
<p><strong>Vendedor (Representado por):</strong> {{usuario.nome}}</p>

<h2>DADOS DO CLIENTE</h2>
<p><strong>Nome:</strong> {{lead.nome}}</p>
<p><strong>Telefone:</strong> {{lead.telefone}}</p>
<p><strong>Email:</strong> {{lead.email}}</p>

<h2>DADOS DO IMÓVEL</h2>
<p><strong>Endereço:</strong> {{imovel.endereco}}</p>
<p><strong>Área:</strong> {{imovel.area}}</p>
<p><strong>Valor do Imóvel:</strong> {{imovel.valor}}</p>

<h2>VALORES DA NEGOCIAÇÃO</h2>
<p><strong>Valor da Proposta:</strong> {{proposta.valor}}</p>

<p>Este contrato vincula as partes acima para a venda da propriedade mencionada.</p>`
      },
      {
        name: "Proposta de Aluguel",
        content: `<h1>PROPOSTA DE ALUGUEL</h1>
<p><strong>Data da Proposta:</strong> {{data.hoje}}</p>
<p><strong>Intermediário:</strong> {{usuario.nome}}</p>

<h2>INTERESSADO</h2>
<p><strong>Nome Completo:</strong> {{lead.nome}}</p>
<p><strong>Contato:</strong> {{lead.telefone}}</p>
<p><strong>Email:</strong> {{lead.email}}</p>

<h2>IMÓVEL PROPOSTO</h2>
<p><strong>Localização:</strong> {{imovel.endereco}}</p>
<p><strong>Metragem:</strong> {{imovel.area}}</p>
<p><strong>Valor do Imóvel:</strong> {{imovel.valor}}</p>

<h2>CONDIÇÕES DA PROPOSTA</h2>
<p><strong>Valor Mensal Proposto:</strong> {{proposta.valor}}</p>

<p>Esta é uma proposta preliminar para aluguel do imóvel descrito acima.</p>`
      },
      {
        name: "Declaração de Interesse",
        content: `<h1>DECLARAÇÃO DE INTERESSE</h1>
<p><strong>Emissão:</strong> {{data.hoje}}</p>
<p><strong>Intermediário:</strong> {{usuario.nome}}</p>

<h2>DADOS DO INTERESSADO</h2>
<p><strong>Nome:</strong> {{lead.nome}}</p>
<p><strong>Telefone:</strong> {{lead.telefone}}</p>
<p><strong>Email:</strong> {{lead.email}}</p>
<p><strong>Origem:</strong> {{lead.origem}}</p>

<h2>IMÓVEL DE INTERESSE</h2>
<p><strong>Endereço:</strong> {{imovel.endereco}}</p>
<p><strong>Valor de Referência:</strong> {{imovel.valor}}</p>

<p>Declaro interesse na propriedade acima mencionada e autorizo contatos para negociação.</p>

<p>_________________________________</p>
<p>Assinatura do Interessado</p>`
      }
    ]

    for (const model of models) {
      await prisma.documentModel.create({
        data: model
      })
      console.log(`✓ Modelo criado: ${model.name}`)
    }

    console.log("✓ Modelos de documentos importados com sucesso!")
  } catch (error) {
    console.error("Erro ao importar modelos:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedDocumentModels()
