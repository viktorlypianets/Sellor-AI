# Sellor-AI Architecture Diagram

## System Overview

Sellor-AI is a comprehensive AI-powered customer support and FAQ management system designed for Shopify merchants. The system provides intelligent chat assistance, automated FAQ generation, and detailed analytics through multiple frontend applications and a robust backend infrastructure.

## Architecture Components

```mermaid
graph TB
    subgraph "External Systems"
        SHOPIFY[Shopify Store]
        OPENAI[OpenAI API]
        SUPABASE[Supabase Database]
    end

    subgraph "Frontend Applications"
        subgraph "Main Dashboard"
            DASHBOARD[Dashboard App<br/>React + Redux]
            FAQ_MGMT[FAQ Management]
            INSIGHTS[Analytics & Insights]
            SETTINGS[Chatbot Settings]
        end

        subgraph "Customer Widget"
            WIDGET_APP[Widget App<br/>React]
            WIDGET_JS[Widget.js<br/>Minified Bundle]
        end

        subgraph "Customer Interface"
            CUSTOMER[Customer View<br/>React]
        end
    end

    subgraph "Backend Services"
        subgraph "Express Server"
            API[API Gateway<br/>Express.js]
            AUTH[Authentication<br/>Shopify OAuth]
            WEBHOOKS[Webhook Handler]
        end

        subgraph "Business Logic"
            AI_SERVICE[AI Service<br/>OpenAI Integration]
            SHOPIFY_SERVICE[Shopify Service<br/>Product Sync]
            CRON_SERVICE[Cron Service<br/>Scheduled Jobs]
        end

        subgraph "Data Layer"
            SUPABASE_CONFIG[Supabase Config<br/>Vector Search]
            EMBEDDINGS[Embedding Generation]
            VECTOR_SEARCH[Semantic Search]
        end
    end

    subgraph "Database Schema"
        PRODUCTS[Products Table]
        FAQS[FAQs Table]
        CHAT_SESSIONS[Chat Sessions]
        CUSTOMERS[Customers Table]
        ORDERS[Orders Table]
        KNOWLEDGE_BASE[Knowledge Base]
        POLICY_DOCS[Policy Documents]
    end

    %% External Connections
    SHOPIFY -->|OAuth & Webhooks| API
    OPENAI -->|GPT-4 & Embeddings| AI_SERVICE
    SUPABASE -->|Database & Auth| SUPABASE_CONFIG

    %% Frontend to Backend
    DASHBOARD -->|REST API| API
    WIDGET_APP -->|Chat API| API
    WIDGET_JS -->|Direct API| API
    CUSTOMER -->|Customer API| API

    %% Backend Internal
    API --> AUTH
    API --> WEBHOOKS
    API --> AI_SERVICE
    API --> SHOPIFY_SERVICE
    API --> CRON_SERVICE

    %% Data Flow
    AI_SERVICE --> SUPABASE_CONFIG
    SHOPIFY_SERVICE --> SUPABASE_CONFIG
    SUPABASE_CONFIG --> EMBEDDINGS
    EMBEDDINGS --> VECTOR_SEARCH

    %% Database Tables
    SUPABASE_CONFIG --> PRODUCTS
    SUPABASE_CONFIG --> FAQS
    SUPABASE_CONFIG --> CHAT_SESSIONS
    SUPABASE_CONFIG --> CUSTOMERS
    SUPABASE_CONFIG --> ORDERS
    SUPABASE_CONFIG --> KNOWLEDGE_BASE
    SUPABASE_CONFIG --> POLICY_DOCS

    %% Styling
    classDef external fill:#e1f5fe
    classDef frontend fill:#f3e5f5
    classDef backend fill:#e8f5e8
    classDef database fill:#fff3e0

    class SHOPIFY,OPENAI,SUPABASE external
    class DASHBOARD,FAQ_MGMT,INSIGHTS,SETTINGS,WIDGET_APP,WIDGET_JS,CUSTOMER frontend
    class API,AUTH,WEBHOOKS,AI_SERVICE,SHOPIFY_SERVICE,CRON_SERVICE,SUPABASE_CONFIG,EMBEDDINGS,VECTOR_SEARCH backend
    class PRODUCTS,FAQS,CHAT_SESSIONS,CUSTOMERS,ORDERS,KNOWLEDGE_BASE,POLICY_DOCS database
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant S as Shopify Store
    participant W as Widget
    participant API as Backend API
    participant AI as AI Service
    participant DB as Supabase
    participant O as OpenAI

    Note over S,DB: Product Creation Flow
    S->>API: Product Created (Webhook)
    API->>DB: Store Product Data
    API->>AI: Generate Product Embeddings
    AI->>O: Create Embeddings
    O->>AI: Return Embeddings
    AI->>DB: Store Embeddings

    Note over S,DB: Customer Chat Flow
    W->>API: Customer Question
    API->>DB: Get Product Context
    API->>AI: Generate Response
    AI->>DB: Semantic Search
    DB->>AI: Relevant Context
    AI->>O: Generate Answer
    O->>AI: Return Answer
    AI->>API: Formatted Response
    API->>W: Send Answer
    API->>DB: Log Conversation

    Note over S,DB: FAQ Management Flow
    S->>API: New Products/Orders
    API->>AI: Analyze for FAQ Generation
    AI->>O: Generate FAQ Content
    O->>AI: Return FAQ
    AI->>DB: Store FAQ
    API->>S: Update Store FAQ
```

## Component Details

### 1. Frontend Applications

#### Main Dashboard (`frontend/`)
- **Technology**: React + Redux + Shopify Polaris
- **Purpose**: Admin interface for merchants
- **Key Features**:
  - FAQ management and editing
  - Chatbot configuration
  - Analytics and insights
  - Customer conversation history
  - Product management

#### Widget Application (`frontend-widget/`)
- **Technology**: React
- **Purpose**: Embeddable chat widget for customer-facing sites
- **Features**:
  - Real-time chat interface
  - AI-powered responses
  - Product context awareness
  - Session management

#### Legacy Widget (`widget/`)
- **Technology**: Minified JavaScript bundle
- **Purpose**: Direct embedding option for stores
- **Features**: Lightweight, single-file deployment

### 2. Backend Services

#### API Gateway (`backend/index.js`)
- **Technology**: Express.js
- **Features**:
  - RESTful API endpoints
  - Shopify OAuth integration
  - Webhook handling
  - Static file serving
  - CORS and middleware management

#### AI Service (`backend/services/aiService.js`)
- **Technology**: OpenAI API integration
- **Features**:
  - GPT-4 powered responses
  - Semantic context retrieval
  - Embedding generation
  - Product relevance checking
  - Unanswered question logging

#### Shopify Service (`backend/services/shopifyService.js`)
- **Technology**: Shopify API integration
- **Features**:
  - Product synchronization
  - Order data retrieval
  - Customer information access
  - FAQ generation triggers

#### Cron Service (`backend/services/cronService.js`)
- **Technology**: Scheduled job management
- **Features**:
  - Automated FAQ generation
  - Data cleanup tasks
  - Analytics aggregation
  - System maintenance

### 3. Data Layer

#### Supabase Configuration (`backend/config/supabase.js`)
- **Technology**: Supabase client with custom RPC functions
- **Features**:
  - Vector similarity search
  - Embedding storage and retrieval
  - Custom error handling
  - Batch operations
  - Schema management

#### Database Schema
- **Products**: Store product information and embeddings
- **FAQs**: Generated and manual FAQ entries
- **Chat Sessions**: Customer conversation history
- **Customers**: Customer profile and order data
- **Knowledge Base**: General knowledge embeddings
- **Policy Documents**: Store policies and terms

### 4. External Integrations

#### Shopify Integration
- **OAuth Flow**: Secure merchant authentication
- **Webhooks**: Real-time product and order updates
- **API Access**: Product, customer, and order data retrieval

#### OpenAI Integration
- **GPT-4**: Advanced conversation responses
- **Embeddings**: Semantic search capabilities
- **Rate Limiting**: Quota management and fallbacks

#### Supabase Integration
- **PostgreSQL**: Primary data storage
- **Vector Search**: Semantic similarity matching
- **Real-time**: Live data synchronization
- **Auth**: User authentication and authorization

## Security Architecture

```mermaid
graph LR
    subgraph "Security Layers"
        HMAC[HMAC Validation]
        OAUTH[OAuth 2.0]
        CORS[CORS Policy]
        RATE_LIMIT[Rate Limiting]
    end

    subgraph "Data Protection"
        ENCRYPTION[Data Encryption]
        ACCESS_CONTROL[Access Control]
        AUDIT_LOG[Audit Logging]
    end

    HMAC --> OAUTH
    OAUTH --> CORS
    CORS --> RATE_LIMIT
    RATE_LIMIT --> ENCRYPTION
    ENCRYPTION --> ACCESS_CONTROL
    ACCESS_CONTROL --> AUDIT_LOG
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Frontend Hosting"
            CDN[CDN/Static Hosting]
            WIDGET_HOST[Widget Hosting]
        end

        subgraph "Backend Hosting"
            API_SERVER[API Server<br/>Node.js/Express]
            LOAD_BALANCER[Load Balancer]
        end

        subgraph "Database"
            SUPABASE_PROD[Supabase Production]
            BACKUP[Automated Backups]
        end

        subgraph "External Services"
            OPENAI_PROD[OpenAI Production]
            SHOPIFY_PROD[Shopify Production]
        end
    end

    CDN --> API_SERVER
    WIDGET_HOST --> API_SERVER
    LOAD_BALANCER --> API_SERVER
    API_SERVER --> SUPABASE_PROD
    API_SERVER --> OPENAI_PROD
    API_SERVER --> SHOPIFY_PROD
    SUPABASE_PROD --> BACKUP
```

## Key Features & Capabilities

### 1. AI-Powered Customer Support
- **Semantic Search**: Context-aware responses using vector embeddings
- **Product Context**: Automatic product information integration
- **Customer History**: Personalized responses based on customer data
- **Fallback Handling**: Graceful degradation when AI is unavailable

### 2. Automated FAQ Management
- **Product-Based Generation**: FAQs generated from product data
- **Order Analysis**: FAQs based on customer order patterns
- **Manual Override**: Admin ability to edit and customize FAQs
- **Version Control**: FAQ history and rollback capabilities

### 3. Analytics & Insights
- **Conversation Analytics**: Chat performance metrics
- **Unanswered Questions**: Tracking of unresolved customer queries
- **Product Performance**: FAQ effectiveness by product
- **Customer Satisfaction**: Response quality metrics

### 4. Multi-Platform Support
- **Shopify Integration**: Native Shopify app capabilities
- **Widget Embedding**: Easy integration into any website
- **API Access**: RESTful API for custom integrations
- **Mobile Responsive**: Optimized for all device types

## Performance Considerations

### 1. Scalability
- **Horizontal Scaling**: Load balancer support for multiple API instances
- **Database Optimization**: Efficient vector search and indexing
- **Caching Strategy**: Redis or similar for frequently accessed data
- **CDN Integration**: Static asset delivery optimization

### 2. Reliability
- **Error Handling**: Comprehensive error management and logging
- **Rate Limiting**: Protection against API abuse
- **Fallback Mechanisms**: Graceful degradation during service outages
- **Monitoring**: Real-time system health monitoring

### 3. Security
- **Data Encryption**: End-to-end encryption for sensitive data
- **Access Control**: Role-based permissions and authentication
- **Audit Logging**: Comprehensive activity tracking
- **Compliance**: GDPR and data protection compliance

This architecture provides a robust, scalable, and secure foundation for AI-powered customer support in e-commerce environments, with particular focus on Shopify integration and user experience optimization. 