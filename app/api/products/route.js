export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(products)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    const product = await prisma.product.create({
      data: {
        name:         data.name,
        category:     data.category,
        price:        Number(data.price),
        salePrice:    data.salePrice ? Number(data.salePrice) : null,
        description:  data.description || null,
        specs:        data.specs || null,
        imageUrl:     data.imageUrl || null,
        deposit:      Number(data.deposit) || 0,
        serialNumber: data.serialNumber || null,
        sku:          data.sku || null,
      },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
