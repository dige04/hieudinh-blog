# Research Report: Data Engineering Side Project for Fresh Graduate Portfolio

**Date**: 2026-02-05
**Target Audience**: Fresh graduate aspiring to become a Data Engineer
**Tech Stack**: Python, Apache Spark, SQL, GCP, Docker, CI/CD

---

## Executive Summary

For a fresh graduate aiming to break into data engineering, **one comprehensive end-to-end project** is more valuable than multiple shallow ones. The ideal project demonstrates the **entire data lifecycle**: ingestion → processing → storage → visualization, with production-grade practices (Docker, CI/CD, monitoring, documentation).

**Top Recommendation**: Build a **Real-time Streaming Data Pipeline on GCP** that:
- Ingests data from a public API (crypto prices, weather, stocks)
- Streams through Pub/Sub or Kafka
- Processes with Spark Streaming or Dataflow
- Stores in BigQuery with proper data modeling
- Visualizes in Looker Studio/Grafana
- Deploys via Docker + GitHub Actions CI/CD

This single project touches ALL required skills and impresses recruiters more than 5 smaller projects.

---

## Key Findings

### 1. What Hiring Managers Actually Look For

| Priority | What They Want | How to Demonstrate |
|----------|----------------|-------------------|
| **#1** | End-to-end implementation | Full pipeline from raw → insights |
| **#2** | Real-world messy data | Use actual APIs, not clean CSVs |
| **#3** | Error handling & robustness | Retry logic, dead letter queues |
| **#4** | Data quality checks | Great Expectations, dbt tests |
| **#5** | Clear documentation | Architecture diagrams, README |
| **#6** | Production practices | Docker, CI/CD, monitoring |

**Key Insight**: Recruiters care more about HOW you built it than WHAT you built. Document your design decisions and trade-offs.

---

### 2. Three Killer Project Ideas (Pick ONE)

#### Option A: Real-time Crypto/Stock Price Tracker (Recommended)
**Why**: Covers streaming, has "cool factor", uses free APIs

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ CoinGecko   │───▶│  Pub/Sub    │───▶│  Dataflow/  │───▶│  BigQuery   │
│ API         │    │  or Kafka   │    │  Spark      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │ Looker/     │
                                      │ Grafana     │
                                      └─────────────┘
```

**Stack**:
- Python: API fetching, Kafka producer
- GCP Pub/Sub or Kafka (Docker): Message queue
- Dataflow (Apache Beam) or Spark Streaming: Processing
- BigQuery: Data warehouse
- Looker Studio or Grafana: Visualization
- Docker Compose: Local development
- GitHub Actions: CI/CD
- Cloud Composer (Airflow): Orchestration (bonus)

**Free Data Sources**:
- CoinGecko API (crypto prices, free tier)
- Alpha Vantage (stocks, free tier)
- OpenWeatherMap (weather data)

---

#### Option B: Batch ETL Data Lakehouse

**Why**: More traditional DE skills, shows data modeling expertise

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Public      │───▶│ Cloud       │───▶│ Dataproc    │───▶│ BigQuery    │
│ Datasets    │    │ Storage     │    │ (Spark)     │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │                  │
      │          Bronze Layer       Silver Layer        Gold Layer
      │          (raw parquet)      (cleaned)          (aggregated)
      │
      └── NYC Taxi, Yelp, Wikipedia, etc.
```

**Stack**:
- GCS: Data lake storage (Bronze/Silver/Gold layers)
- Dataproc + PySpark: Distributed processing
- BigQuery: Analytics warehouse
- Cloud Composer: Orchestration
- dbt: Transformations (bonus)
- Delta Lake or Apache Iceberg: ACID transactions (bonus)

---

#### Option C: API-Driven Analytics Platform

**Why**: Shows full-stack thinking, good for companies with many APIs

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Multiple    │───▶│ Python      │───▶│ PostgreSQL/ │───▶│ Dashboard   │
│ APIs        │    │ Extractors  │    │ BigQuery    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                  │
   GitHub API       Airflow DAGs
   Twitter API      (scheduled)
   Weather API
```

---

### 3. Technical Implementation Guide

#### GCP Services to Use (Free Tier Friendly)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Cloud Storage | Data lake | 5 GB |
| BigQuery | Data warehouse | 10 GB storage, 1 TB queries/month |
| Pub/Sub | Messaging | 10 GB/month |
| Dataflow | Stream processing | No free tier (use Spark locally) |
| Dataproc | Spark clusters | No free tier (use local Spark) |
| Cloud Composer | Airflow | No free tier (use local Airflow) |
| Cloud Functions | Triggers | 2M invocations/month |

**Cost-Saving Strategy**: Develop locally with Docker, deploy only final version to GCP.

#### Docker Compose Setup (Local Development)

```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092

  spark-master:
    image: bitnami/spark:3.5.0
    ports:
      - "8080:8080"
      - "7077:7077"

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: analytics
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  grafana:
    image: grafana/grafana:10.2.2
    ports:
      - "3000:3000"
```

#### Python Producer Example

```python
# producer.py - Ingest crypto prices to Kafka
import requests
import json
import time
from kafka import KafkaProducer

KAFKA_BROKER = 'localhost:9092'
TOPIC = 'crypto_prices'
API_URL = "https://api.coingecko.com/api/v3/simple/price"
COINS = ['bitcoin', 'ethereum', 'solana']

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BROKER],
    value_serializer=lambda x: json.dumps(x).encode('utf-8')
)

while True:
    response = requests.get(API_URL, params={
        'ids': ','.join(COINS),
        'vs_currencies': 'usd'
    })
    data = response.json()

    for coin, price_data in data.items():
        message = {
            'coin': coin,
            'price_usd': price_data['usd'],
            'timestamp': int(time.time() * 1000)
        }
        producer.send(TOPIC, value=message)
        print(f"Sent: {message}")

    producer.flush()
    time.sleep(30)  # Respect API rate limits
```

#### PySpark Consumer Example

```python
# consumer.py - Process stream and write to database
from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StringType, DoubleType, LongType

spark = SparkSession.builder \
    .appName("CryptoProcessor") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0") \
    .getOrCreate()

schema = StructType() \
    .add("coin", StringType()) \
    .add("price_usd", DoubleType()) \
    .add("timestamp", LongType())

df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "crypto_prices") \
    .load()

parsed = df.select(
    from_json(col("value").cast("string"), schema).alias("data")
).select("data.*")

# Write to console for testing
query = parsed.writeStream \
    .outputMode("append") \
    .format("console") \
    .start()

query.awaitTermination()
```

#### GitHub Actions CI/CD

```yaml
# .github/workflows/main.yml
name: Data Pipeline CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Lint
        run: |
          pip install ruff
          ruff check .

      - name: Unit tests
        run: pytest tests/ -v

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker images
        run: |
          docker build -t producer:latest ./producer
          docker build -t consumer:latest ./consumer

      - name: Push to registry (optional)
        run: echo "Push to GCR or Docker Hub here"
```

---

### 4. Repository Structure

```
data-pipeline-project/
├── README.md                 # Project overview, architecture, setup
├── docker-compose.yml        # Local development environment
├── requirements.txt          # Python dependencies
├── .github/
│   └── workflows/
│       └── main.yml          # CI/CD pipeline
├── producer/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       └── producer.py       # Data ingestion
├── consumer/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       └── consumer.py       # Spark processing
├── sql/
│   ├── schema.sql            # Database schema
│   └── queries/              # Analytical queries
├── airflow/
│   └── dags/                 # Orchestration DAGs
├── tests/
│   ├── test_producer.py
│   └── test_consumer.py
├── docs/
│   ├── architecture.md       # Detailed architecture
│   └── decisions.md          # Design decisions log
└── grafana/
    └── dashboards/           # Dashboard JSON exports
```

---

### 5. README Template

```markdown
# Real-time Crypto Analytics Pipeline

End-to-end data engineering project demonstrating streaming data processing.

## Architecture

[Insert architecture diagram here]

## Tech Stack

| Layer | Technology |
|-------|------------|
| Ingestion | Python, CoinGecko API |
| Streaming | Apache Kafka |
| Processing | Apache Spark Streaming |
| Storage | PostgreSQL / BigQuery |
| Visualization | Grafana / Looker Studio |
| Orchestration | Docker Compose (dev), Airflow (prod) |
| CI/CD | GitHub Actions |

## Quick Start

```bash
# Clone and start
git clone https://github.com/username/crypto-pipeline
cd crypto-pipeline
docker-compose up -d

# Access services
# Kafka UI: http://localhost:9021
# Spark UI: http://localhost:8080
# Grafana: http://localhost:3000 (admin/admin)
```

## Data Flow

1. **Ingest**: Fetch prices from CoinGecko every 30s
2. **Queue**: Publish to Kafka topic `crypto_prices`
3. **Process**: Spark Streaming consumes, transforms, enriches
4. **Store**: Write to PostgreSQL / BigQuery
5. **Visualize**: Grafana dashboards show real-time trends

## Design Decisions

- **Why Kafka over Pub/Sub locally?** Easier local development, GCP-portable
- **Why Spark over Flink?** More Python-friendly, better job market demand
- **Why PostgreSQL locally?** Free, easy Docker setup, SQL practice

## Future Enhancements

- [ ] Add Apache Airflow for scheduling
- [ ] Deploy to GCP (Pub/Sub + Dataflow + BigQuery)
- [ ] Add Great Expectations for data quality
- [ ] Implement CDC with Debezium
```

---

### 6. What Makes You Stand Out

| Do This | Not This |
|---------|----------|
| Use real, messy APIs | Use pre-cleaned Kaggle CSVs |
| Handle failures gracefully | Assume data is perfect |
| Document WHY you chose tools | Just list what you used |
| Show data quality checks | Skip validation |
| Include architecture diagrams | Text-only explanations |
| Write tests | No tests |
| Use incremental loading | Full refresh only |
| Monitor with dashboards | No observability |

---

### 7. Interview Presentation Tips

1. **Start with impact**: "This pipeline processes X records/day with Y% uptime"
2. **Show architecture first**: Visual diagram before code
3. **Discuss trade-offs**: "I chose Kafka over RabbitMQ because..."
4. **Admit limitations**: "If I rebuilt this, I would..."
5. **Deep dive ready**: Be prepared for questions on:
   - How you handle late-arriving data
   - Exactly-once vs at-least-once semantics
   - Partitioning strategy
   - Backpressure handling

---

## Recommended Learning Path

1. **Week 1-2**: Docker + Docker Compose basics
2. **Week 3-4**: Kafka fundamentals + Python producer/consumer
3. **Week 5-6**: PySpark basics (DataFrames, SQL, Streaming)
4. **Week 7-8**: Build the pipeline, local first
5. **Week 9-10**: Add tests, CI/CD, documentation
6. **Week 11-12**: Deploy to GCP, add monitoring

---

## Free Resources

### Datasets
- [CoinGecko API](https://www.coingecko.com/en/api) - Crypto prices
- [NYC Taxi Data](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page) - Large batch dataset
- [Yelp Dataset](https://www.yelp.com/dataset) - Reviews, businesses
- [Wikipedia Dumps](https://dumps.wikimedia.org/) - Text data

### Learning
- [GCP Data Engineering Learning Path](https://cloud.google.com/learn/training/data-engineering-and-analytics)
- [Spark: The Definitive Guide](https://www.oreilly.com/library/view/spark-the-definitive/9781491912201/) (free online)
- [DataTalksClub Data Engineering Zoomcamp](https://github.com/DataTalksClub/data-engineering-zoomcamp) (free course)

### GitHub Templates
- [datarootsio/skeleton-pyspark](https://github.com/datarootsio/skeleton-pyspark) - PySpark project template
- [AlexIoannides/pyspark-example-project](https://github.com/AlexIoannides/pyspark-example-project) - Best practices

---

## Summary: Action Plan

1. **Pick Project A** (Real-time Crypto Tracker) - best skill demonstration
2. **Start with Docker Compose** - local Kafka + Spark + PostgreSQL
3. **Build incrementally**: Producer → Consumer → Storage → Dashboard
4. **Add production features**: Tests, CI/CD, error handling, docs
5. **Deploy minimal version to GCP** using free tier
6. **Document everything**: Architecture, decisions, learnings

**Estimated effort**: 4-8 weeks part-time

---

## Unresolved Questions

- Should you get GCP certification first? (Not required, but helps)
- Spark vs Flink for streaming? (Spark has better job market)
- Kafka vs Pub/Sub locally? (Kafka easier, Pub/Sub emulator exists)
