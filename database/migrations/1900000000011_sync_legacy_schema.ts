import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Check and rename 'name' to 'razao_social' in 'empresas'
    try {
      await this.db.rawQuery('ALTER TABLE tavolo.empresas RENAME COLUMN name TO razao_social')
      console.log('Renamed name to razao_social in empresas')
    } catch (e) {
      console.log('Skipped rename name in empresas (might not exist): ' + e.message)
    }

    // Add missing columns to 'empresas' if they don't exist
    try {
      await this.db.rawQuery('ALTER TABLE tavolo.empresas ADD COLUMN cpf varchar(14)')
    } catch (e) {}
    try {
      await this.db.rawQuery('ALTER TABLE tavolo.empresas ADD COLUMN document_type varchar(255) DEFAULT \'cnpj\'')
    } catch (e) {}
    try {
      await this.db.rawQuery('ALTER TABLE tavolo.empresas ADD COLUMN regime_tributario integer DEFAULT 1')
    } catch (e) {}
    try {
      await this.db.rawQuery('ALTER TABLE tavolo.empresas ADD COLUMN cod_municipio varchar(7)')
    } catch (e) {}
    try {
      await this.db.rawQuery('ALTER TABLE tavolo.empresas ADD COLUMN nota_fiscal_footer_message text')
    } catch (e) {}

    // Check and rename columns in 'users'
    try {
      await this.db.rawQuery('ALTER TABLE tavolo.users RENAME COLUMN telefone TO phone')
    } catch (e) {}
    
    const hasAtivo = await this.schema.withSchema('tavolo').hasColumn('users', 'ativo')
    if (hasAtivo) {
      try {
        await this.db.rawQuery('ALTER TABLE tavolo.users ADD COLUMN status varchar(255) DEFAULT \'active\'')
      } catch (e) {}
      
      try {
        await this.db.rawQuery(`
          UPDATE tavolo.users SET status = CASE WHEN ativo = true THEN 'active' ELSE 'inactive' END
        `)
      } catch (e) {}
    }

    // Convert 'perfil' (text) to 'role_id' (integer)
    const hasPerfil = await this.schema.withSchema('tavolo').hasColumn('users', 'perfil')
    const hasRoleId = await this.schema.withSchema('tavolo').hasColumn('users', 'role_id')
    
    if (hasPerfil && !hasRoleId) {
      try {
        await this.db.rawQuery(`
          INSERT INTO tavolo.roles (name, description, created_at, updated_at) 
          VALUES ('ADMIN', 'Administrador do Sistema', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), 
                 ('GERENTE', 'Gerente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), 
                 ('GARCOM', 'Garçom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (name) DO NOTHING
        `)
      } catch (e) {
        console.log('Error inserting roles: ' + e.message)
      }

      try {
        await this.db.rawQuery('ALTER TABLE tavolo.users ADD COLUMN role_id integer REFERENCES tavolo.roles(id) ON DELETE RESTRICT')
      } catch (e) {}

      try {
        await this.db.rawQuery(`
          UPDATE tavolo.users u
          SET role_id = r.id
          FROM tavolo.roles r
          WHERE UPPER(u.perfil) = r.name
        `)
      } catch (e) {}

      try {
        await this.db.rawQuery(`
          UPDATE tavolo.users
          SET role_id = (SELECT id FROM tavolo.roles WHERE name = 'ADMIN' LIMIT 1)
          WHERE role_id IS NULL
        `)
      } catch (e) {}

      try {
        await this.db.rawQuery('ALTER TABLE tavolo.users ALTER COLUMN role_id SET NOT NULL')
      } catch (e) {}
    }

    // Add missing columns in users
    try {
      await this.db.rawQuery('ALTER TABLE tavolo.users ADD COLUMN birth_date date')
    } catch (e) {}
    try {
      await this.db.rawQuery('ALTER TABLE tavolo.users ADD COLUMN cpf varchar(14)')
    } catch (e) {}
    try {
      await this.db.rawQuery('ALTER TABLE tavolo.users ADD COLUMN created_by integer REFERENCES tavolo.users(id) ON DELETE SET NULL')
    } catch (e) {}
    try {
      await this.db.rawQuery('ALTER TABLE tavolo.users ADD COLUMN updated_by integer REFERENCES tavolo.users(id) ON DELETE SET NULL')
    } catch (e) {}
  }

  async down() {
    // Only drop newly added columns or rename them back
  }
}
