[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "column_name": "email",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "avatar_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "phone",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "birth_date",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "role",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'user'::text"
  },
  {
    "column_name": "team_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "auth_user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "onboarding",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "column_name": "openpix_recipient_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "openpix_pix_key",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "commission_percent",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "column_name": "openpix_pix_key_type",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "rua",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "bairro",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "cidade",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "cep",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "numero",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "complemento",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "openpix_subaccount_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "instance_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "aud",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "role",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "email",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "encrypted_password",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "email_confirmed_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "invited_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "confirmation_token",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "confirmation_sent_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "recovery_token",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "recovery_sent_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "email_change_token_new",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "email_change",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "email_change_sent_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "last_sign_in_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "raw_app_meta_data",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "raw_user_meta_data",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "is_super_admin",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "phone",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "NULL::character varying"
  },
  {
    "column_name": "phone_confirmed_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "phone_change",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "''::character varying"
  },
  {
    "column_name": "phone_change_token",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": "''::character varying"
  },
  {
    "column_name": "phone_change_sent_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "confirmed_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "email_change_token_current",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": "''::character varying"
  },
  {
    "column_name": "email_change_confirm_status",
    "data_type": "smallint",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "column_name": "banned_until",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "reauthentication_token",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": "''::character varying"
  },
  {
    "column_name": "reauthentication_sent_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "is_sso_user",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false"
  },
  {
    "column_name": "deleted_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "is_anonymous",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false"
  }
]