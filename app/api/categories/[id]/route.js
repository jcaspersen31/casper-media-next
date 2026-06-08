export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req, { params }) {
  try {
    const data = await req.json()
    const cat = await prisma.category.update({
      where: { id: Number(params.id) },
      data: { name: data.name, sortOrder: data.sortOrder ?? undefined }
    })
    return NextResponse.json(cat)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    // Check if any products use this category
    const count = await prisma.product.count({
      where: { categoryId: Number(params.id), active: true }
    })
    if (count > 0) {
      return NextResponse.json({ error: `Cannot delete — ${count} product(s) use this category` }, { status: 400 })
    }
    await prisma.category.update({
      where: { id: Number(params.id) },
      data: { active: false }
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
