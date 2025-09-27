import type {
  ContentHeading,
  ContentLayerEntity,
  ContentLayerProviderOptions,
  ContentLayerSearchPostsParams,
  ContentLayerWherePostsParams,
  ContentTypeResult,
  IContentLayerProvider,
} from './types'
import type { StandardSchemaV1 } from '@igniter-js/core'

import matter from 'gray-matter'
import * as path from 'node:path'

import { promises as fs } from 'node:fs'

type CachedEntry<
  TTypes extends Record<string, ContentLayerEntity<string, StandardSchemaV1>>,
> = ContentTypeResult<Record<string, unknown>> & {
  type: keyof TTypes
}

/**
 * ContentLayerProvider - Uma abstração para trabalhar com conteúdo em markdown
 * Implementa uma API para buscar e listar posts a partir de arquivos markdown
 */
export class ContentLayerProvider<
  TTypes extends Record<string, ContentLayerEntity<string, StandardSchemaV1>>,
> implements IContentLayerProvider<TTypes>
{
  private contentCache: Map<string, CachedEntry<TTypes>> = new Map()
  private initialized = false

  constructor(private readonly options: ContentLayerProviderOptions<TTypes>) {}

  private getSchema<TType extends keyof TTypes>(type: TType) {
    const entity = this.options.schemas[type]
    if (!entity) {
      throw new Error(`Content schema not found for type ${String(type)}`)
    }
    return entity
  }

  private normalizeFrontmatter(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }

    return {}
  }

  private async buildResult<TType extends keyof TTypes>(
    type: TType,
    entry: CachedEntry<TTypes>,
  ): Promise<
    ContentTypeResult<StandardSchemaV1.InferOutput<TTypes[TType]['schema']>>
  > {
    const entity = this.getSchema(type)
    const typeKey = this.stringifyType(type)
    const validation = await entity.schema['~standard'].validate(entry.data)

    if ('issues' in validation && validation.issues?.length) {
      const messages = validation.issues.map((issue) => issue.message).join(', ')
      throw new Error(
        `Invalid content for type ${typeKey} at slug ${entry.slug}: ${messages}`,
      )
    }

    if (!('value' in validation)) {
      throw new Error(
        `Invalid content for type ${typeKey} at slug ${entry.slug}: missing value`,
      )
    }

    const { type: _entryType, ...rest } = entry

    return {
      ...rest,
      data: validation.value,
    }
  }

  private getEntriesByType<TType extends keyof TTypes>(
    type: TType,
  ): CachedEntry<TTypes>[] {
    return Array.from(this.contentCache.values()).filter(
      (entry) => entry.type === type,
    )
  }

  private compareValues(
    a: unknown,
    b: unknown,
    direction: 'asc' | 'desc',
  ): number {
    const order = direction === 'asc' ? 1 : -1

    if (typeof a === 'number' && typeof b === 'number') {
      return a < b ? -order : a > b ? order : 0
    }

    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b) * order
    }

    if (typeof a === 'boolean' && typeof b === 'boolean') {
      return a === b ? 0 : a ? order : -order
    }

    if (a instanceof Date && b instanceof Date) {
      const valueA = a.getTime()
      const valueB = b.getTime()
      return valueA < valueB ? -order : valueA > valueB ? order : 0
    }

    return 0
  }

  private toGroupKey(value: unknown): string {
    if (value === undefined || value === null) {
      return 'undefined'
    }

    if (typeof value === 'string') {
      return value
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }

    if (value instanceof Date) {
      return value.toISOString()
    }

    return JSON.stringify(value)
  }

  private stringifyType(type: keyof TTypes): string {
    if (typeof type === 'symbol') {
      return type.toString()
    }

    return String(type)
  }

  /**
   * Inicializa o cache de conteúdo
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return

    const schemaEntries = Object.keys(this.options.schemas) as Array<keyof TTypes>

    for (const type of schemaEntries) {
      const entity = this.getSchema(type)
      const contentPath = path.join(process.cwd(), entity.path)

      try {
        await this.readContentDirectory(contentPath, type)
      } catch (error) {
        console.warn(`Failed to read content directory for ${String(type)}:`, error)
      }
    }

    this.initialized = true
  }

  /**
   * Lê recursivamente um diretório e processa arquivos markdown
   */
  private async readContentDirectory<TType extends keyof TTypes>(
    dirPath: string,
    type: TType,
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          await this.readContentDirectory(fullPath, type)
        } else if (
          entry.isFile() &&
          (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))
        ) {
          await this.processMarkdownFile(fullPath, type)
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error)
    }
  }

  /**
   * Processa um arquivo markdown e armazena no cache
   */
  private async processMarkdownFile<TType extends keyof TTypes>(
    filePath: string,
    type: TType,
  ): Promise<void> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')

      const { data: frontmatter, content } = matter(fileContent)

      // Extrai o slug do caminho do arquivo
      const entity = this.getSchema(type)
      const typeKey = this.stringifyType(type)
      const entityBasePath = path.join(process.cwd(), entity.path)
      const relativePath = path.relative(entityBasePath, filePath)
      const slug = relativePath.replace(/\.mdx?$/, '').replace(/\\/g, '/')

      // Extrai headings do conteúdo
      const headings = this.extractHeadings(content)

      // Cria o ID único para o post
      const id = `${typeKey}:${slug}`

      // Gera o excerpt
      const excerpt = this.generateExcerpt(content)

      const normalizedData = this.normalizeFrontmatter(frontmatter)

      // Armazena no cache
      this.contentCache.set(id, {
        type,
        id,
        slug,
        content,
        excerpt,
        headings,
        data: normalizedData,
      })
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error)
    }
  }

  /**
   * Gera um excerpt do conteúdo
   */
  private generateExcerpt(content: string): string {
    const plainText = content.replace(/[#*`]/g, '').replace(/\n+/g, ' ')
    return (
      plainText.substring(0, 160).trim() + (plainText.length > 160 ? '...' : '')
    )
  }

  /**
   * Extrai headings do conteúdo markdown
   */
  private extractHeadings(content: string): ContentHeading[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const headings: ContentHeading[] = []
    const headingsByLevel: (ContentHeading | null)[] = []

    let match
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const title = match[2].trim()
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

      const heading: ContentHeading = {
        id,
        title,
        path: `#${id}`,
        level,
        items: [],
      }

      // Adiciona à lista de headings
      headings.push(heading)

      // Organiza hierarquia
      if (level === 1) {
        headingsByLevel[0] = heading
      } else {
        const parentLevel = level - 2
        const parentHeading = headingsByLevel[parentLevel]
        if (parentHeading) {
          parentHeading.items.push(heading)
        }
        headingsByLevel[level - 1] = heading
      }
    }

    return headings
  }

  /**
   * Busca um post específico com base nos critérios fornecidos
   * @param params Parâmetros opcionais para busca do post
   * @returns Promise com o resultado da busca
   * @throws Error quando não encontra um post correspondente ou quando parâmetros inválidos são fornecidos
   */
  async getPost(): Promise<
    ContentTypeResult<
      StandardSchemaV1.InferOutput<TTypes[keyof TTypes]['schema']>
    > | null
  >
  async getPost<TType extends keyof TTypes>(
    params: ContentLayerWherePostsParams<TTypes, TType>,
  ): Promise<ContentTypeResult<
    StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
  > | null>
  async getPost<TType extends keyof TTypes>(
    params?: ContentLayerWherePostsParams<TTypes, TType>,
  ) {
    await this.initialize()

    if (!params) {
      const iterator = this.contentCache.values().next()
      if (iterator.done || !iterator.value) {
        return null
      }

      return this.buildResult(iterator.value.type, iterator.value)
    }

    const posts = await this.listPosts(params)
    return posts[0] ?? null
  }

  /**
   * Busca um post específico pelo slug
   * @param params Parâmetros com o tipo de conteúdo e o slug
   * @returns Promise com o resultado da busca
   * @throws Error quando não encontra um post correspondente ou quando parâmetros inválidos são fornecidos
   */
  async getPostBySlug<TType extends keyof TTypes>(
    type: TType,
    slug: string,
  ): Promise<ContentTypeResult<
    StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
  > | null> {
    await this.initialize()

    // Validação de tipo
    const entity = this.getSchema(type)
    const typeKey = this.stringifyType(type)

    // Validação de slug
    if (!slug) {
      throw new Error('Slug is required')
    }

    // Gera o ID do post com base no tipo e slug
    const postId = `${typeKey}:${slug}`

    // Tenta encontrar o post diretamente pelo ID
    const post = this.contentCache.get(postId)

    if (post && post.type === type) {
      return this.buildResult(type, post)
    }

    // Se não encontrar diretamente, tenta buscar pelo slug normalizado
    const normalizedSlug = slug.toLowerCase().replace(/\//g, '-')

    const typeEntries = this.getEntriesByType(type)

    const matchingPost = typeEntries.find((entry) => {
      const entrySlugNormalized = entry.slug.toLowerCase().replace(/\//g, '-')
      return entry.slug === slug || entrySlugNormalized === normalizedSlug
    })

    if (!matchingPost) {
      return null
    }

    return this.buildResult(type, matchingPost)
  }

  /**
   * Lista posts com base nos critérios fornecidos
   */
  async listPosts<TType extends keyof TTypes>(
    params: ContentLayerSearchPostsParams<TTypes, TType>,
  ): Promise<
    ContentTypeResult<StandardSchemaV1.InferOutput<TTypes[TType]['schema']>>[]
  > {
    await this.initialize()

    const {
      type,
      where,
      orderBy,
      orderDirection = 'asc',
      limit,
      offset = 0,
    } = params

    // Validação de tipo
    this.getSchema(type)

    const entries = this.getEntriesByType(type)

    if (entries.length === 0) {
      return []
    }

    let results = await Promise.all(
      entries.map((entry) => this.buildResult(type, entry)),
    )

    if (where && Object.keys(where).length > 0) {
      const whereKeys = Object.keys(where) as Array<keyof typeof where>

      results = results.filter((result) => {
        return whereKeys.every((key) => {
          const expected = where[key]
          if (typeof expected === 'undefined') {
            return true
          }

          const dataRecord = result.data as Record<string, unknown>
          const actual = dataRecord[String(key)]
          return Object.is(actual, expected)
        })
      })
    }

    if (orderBy) {
      results = [...results].sort((a, b) => {
        const dataA = a.data as Record<string, unknown>
        const dataB = b.data as Record<string, unknown>
        const valueA = dataA[String(orderBy)]
        const valueB = dataB[String(orderBy)]
        return this.compareValues(valueA, valueB, orderDirection)
      })
    }

    if (typeof limit === 'number') {
      return results.slice(offset, offset + limit)
    }

    if (offset > 0) {
      return results.slice(offset)
    }

    return results
  }

  /**
   * Lista posts agrupados por um campo específico
   */
  async listPostsGroupedBy<TType extends keyof TTypes>({
    type,
    field,
    orderBy,
    orderDirection = 'asc',
  }: {
    type: TType
    field: keyof StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
    orderBy?: keyof StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
    orderDirection: 'asc' | 'desc'
  }): Promise<
    Record<
      string,
      ContentTypeResult<StandardSchemaV1.InferOutput<TTypes[TType]['schema']>>[]
    >
  > {
    await this.initialize()

    this.getSchema(type)

    const results = await this.listPosts({
      type,
      orderBy,
      orderDirection,
    })

    if (results.length === 0) {
      return {}
    }

    const groupedResults: Record<
      string,
      ContentTypeResult<StandardSchemaV1.InferOutput<TTypes[TType]['schema']>>[]
    > = {}

    for (const result of results) {
      const fieldValue = result.data[field]
      const groupKey = this.toGroupKey(fieldValue)
      if (!groupedResults[groupKey]) {
        groupedResults[groupKey] = []
      }
      groupedResults[groupKey].push(result)
    }

    return groupedResults
  }

  /**
   * Cria uma entidade ContentLayer com um nome, schema e path
   */
  static entity<TName extends string, TSchema extends StandardSchemaV1>(
    name: TName,
    schema: TSchema,
    path: string,
  ): ContentLayerEntity<TName, TSchema> {
    return { name, schema, path }
  }

  /**
   * Inicializa o ContentLayerProvider com as entidades fornecidas
   */
  static initialize<
    TTypes extends Record<string, ContentLayerEntity<string, StandardSchemaV1>>,
  >(
    options: ContentLayerProviderOptions<TTypes>,
  ): ContentLayerProvider<TTypes> {
    return new ContentLayerProvider<TTypes>(options)
  }
}
