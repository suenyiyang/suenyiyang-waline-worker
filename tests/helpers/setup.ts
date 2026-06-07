import schema from '../../schema.sql?raw';

export async function setupDB(db: D1Database): Promise<void> {
  await db.exec(schema);
}
