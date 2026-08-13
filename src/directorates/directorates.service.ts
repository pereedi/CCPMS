import { prisma } from '../config/database';

export class DirectoratesService {
  /**
   * Returns the 7 official directorates with their roster member count.
   */
  async getDirectorates() {
    const directorates = await prisma.directorate.findMany({
      include: { organization: true },
      orderBy: { name: 'asc' },
    });
    return directorates.map((d) => ({
      id:          d.id,
      name:        d.name,
      code:        d.code,
      description: d.description,
      organization: d.organization ? { id: d.organization.id, name: d.organization.name } : null,
      createdAt:   d.createdAt,
    }));
  }

  async getDirectorateByCode(code: string) {
    const d = await prisma.directorate.findUnique({
      where:   { code: code.toUpperCase() },
      include: { organization: true },
    });
    if (!d) throw new Error(`Directorate "${code}" not found`);
    return d;
  }

  async getDirectorateById(id: string) {
    const d = await prisma.directorate.findUnique({
      where:   { id },
      include: { organization: true },
    });
    if (!d) throw new Error('Directorate not found');
    return d;
  }
}
