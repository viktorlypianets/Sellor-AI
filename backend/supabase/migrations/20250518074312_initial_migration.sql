-- Stores
create extension if not exists vector with schema public;

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_domain TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scopes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id),
  shopify_product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  metafields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, shopify_product_id)
);

-- FAQs
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  source TEXT CHECK (source IN ('AI', 'Merchant', 'Customer')),
  seo_optimized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  session_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Base
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536)
);

-- Product Embeddings
CREATE TABLE product_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  content TEXT NOT NULL,
  embedding vector(1536)
);

-- Policy Documents
CREATE TABLE policy_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id),
  policy_type TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536)
);

-- Widget Settings
CREATE TABLE widget_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id),
  position TEXT CHECK (position IN ('bottom-left', 'bottom-right')),
  color_theme JSONB,
  tone TEXT CHECK (tone IN ('professional', 'witty', 'empathetic'))
);

-- Unanswered Questions
CREATE TABLE unanswered_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for vector search
CREATE INDEX ON product_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON policy_documents USING ivfflat (embedding vector_cosine_ops);