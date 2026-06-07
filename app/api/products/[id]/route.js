export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req, { params }) {
  try {
    const data = await req.json()
    const product = await prisma.product.update({
      where: { id: Number(params.id) },
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
    return NextResponse.json(product)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    await prisma.product.update({
      where: { id: Number(params.id) },
      data: { active: false },
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
