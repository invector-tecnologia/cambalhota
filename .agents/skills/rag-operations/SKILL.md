---
name: rag-operations
description: "Use when you need end-to-end RAG operations in Maestro: corpus ingestion, chunking policy, retrieval tuning, reranking checks, eval dataset execution, and report persistence."
---

# RAG Operations Skill

This skill governs end-to-end Retrieval-Augmented Generation (RAG) operations within the Maestro workspace. It provides protocols for updating the document corpus, configuring text chunking/overlapping, optimizing retrieval, testing candidate pipelines against golden query sets, and evaluating RAG quality metrics.

## Use When

- You need to ingest new documentation or refresh the existing local corpus.
- You need to tune chunking policies (e.g., character split, markdown headers, semantic grouping).
- You need to optimize retrieval models, search parameters (e.g., semantic vs. lexical ratios), or top-$k$ parameters.
- You need to audit reranker models (e.g., Cross-Encoders) and threshold levels to reduce token usage and context noise.
- You need to execute baseline vs. candidate evaluation datasets to detect regression.

## Key Pipeline Components

1. **Document Corpus**: Raw source files (Markdown, PDF, JSON, Source Code) inside directory scopes.
2. **Chunking Strategy**: Size, overlap, and parser settings tailored to the file formats.
3. **Vector Store / Index**: Distance metrics (Cosine, L2) and metadata mappings.
4. **Retrieval Strategy**: Hybrid retrieval (Dense Semantic + Sparse BM25 lexical) with RRF (Reciprocal Rank Fusion) parameters.
5. **Reranker (Optional)**: Secondary refinement filter to sort chunks by strict query relevance.
6. **Evaluation Metrics**: Faithfulness, Answer Relevance, Context Recall, and Context Precision.

## Workflow

### 1. Configure Workspace & Scope

- Locate the config file or environment variables specifying:
  - Vector DB endpoint / index name.
  - Document directories and file glob patterns.
  - Model definitions (Embeddings, Reranker, LLM).
- Establish the current baseline evaluation score before modifying pipeline code.

### 2. Prepare and Chunk Corpus

- Analyze raw files for layout-specific characteristics:
  - **Code files**: Use syntax-aware or AST-based splitting to keep function/class definitions together.
  - **Markdown/Docs**: Respect section boundaries and header levels (`#`, `##`, `###`).
- Apply the target chunk size (e.g., 512 tokens) and overlap (e.g., 10-20% overlap).
- Inject essential metadata into every chunk (e.g., source path, header parent hierarchy, modified date, category tags).

### 3. Build/Refresh the Index

- Generate embeddings and write documents to the vector store.
- If performing incremental updates, match source file hashes to prevent redundant vector encoding.
- Verify storage layout and index build status.

### 4. Optimize Retrieval and Reranking

- Execute candidate queries to benchmark retrieval.
- Tune the dense-to-sparse ratio:
  - **Lexical-heavy queries**: Exact code keywords, variable names, error logs.
  - **Semantic-heavy queries**: High-level conceptual questions, architectural summaries.
- Apply a reranker to filter retrieved passages down to the top $N$ most relevant chunks. Verify that the threshold filter drops irrelevant context without losing key facts.

### 5. Validate Citations & Hallucinations

- Check that the LLM references the exact chunk IDs or source URIs for all claims.
- Run queries designed to trigger empty searches (out-of-scope queries) and confirm that the system correctly returns "I don't know" instead of hallucinating.

### 6. Run Evaluation & Persist Report

- Run the golden dataset against the modified RAG pipeline.
- Measure and calculate key metrics:
  - **Context Recall**: Ratio of relevant ground-truth facts retrieved.
  - **Context Precision**: Rank-aware precision of retrieved chunks.
  - **Faithfulness**: LLM output consistency with the retrieved context.
  - **Answer Relevance**: Semantic similarity of LLM output to user query.
- Generate a summary report outlining the deltas in pass rates. If any metric falls below the baseline threshold, document the regression.

## Outputs

- **Ingestion Log**: Summarizing chunk count, duplicate counts, and average chunk size.
- **Retrieval Performance Audit**: Highlighting Top-$k$ query/citation samples.
- **Evaluation Report**: Persisted JSON/Markdown showing metric scores and pass/fail transitions.
- **Delta Analysis**: Score comparisons against baseline runs.
