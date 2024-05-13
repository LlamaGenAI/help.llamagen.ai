import { Pump } from '@/.basehub/react-pump'
import { RichText } from '@/.basehub/react-rich-text'
import {
  Box,
  Button,
  Card,
  Code,
  Container,
  Flex,
  Heading,
  Link,
  Separator,
  Text,
} from '@radix-ui/themes'
import NextLink from 'next/link'
import { basehub } from '@/.basehub'
import { notFound } from 'next/navigation'
import { CategoryMeta } from '@/app/_components/category-card'
import { ArticleMeta } from '@/app/_components/article-link'
import Image from 'next/image'
import { Callout } from '@/app/_components/callout'
import { Fragment } from 'react'
import { ArticlesList } from '@/app/_components/articles-list'
import { TOCRenderer } from '@/app/_components/toc'

export const generateStaticParams = async () => {
  const data = await basehub().query({
    index: {
      categoriesSection: {
        title: true,
        categories: {
          items: {
            ...CategoryMeta,
            articles: {
              items: ArticleMeta,
            },
          },
        },
      },
    },
  })

  return data.index.categoriesSection.categories.items
    .map((category) => {
      return category.articles.items.map((article) => {
        return { category: category._slug, article: article._slug }
      })
    })
    .flat()
}

export default function ArticlePage({
  params,
}: {
  params: { category: string; article: string }
}) {
  return (
    <Pump
      queries={[
        {
          index: {
            categoriesSection: {
              title: true,
              categories: {
                __args: {
                  first: 1,
                  filter: { _sys_slug: { eq: params.category } },
                },
                items: {
                  ...CategoryMeta,
                  articles: {
                    __args: {
                      first: 1,
                      filter: { _sys_slug: { eq: params.article } },
                    },
                    items: {
                      ...ArticleMeta,
                      body: {
                        json: {
                          toc: true,
                          content: true,
                          blocks: {
                            _id: true,
                            __typename: true,
                            content: {
                              plainText: true,
                            },
                            type: true,
                          },
                        },
                      },
                      related: {
                        _title: true,
                        _id: true,
                        _slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]}
    >
      {async ([data]) => {
        'use server'

        const category = data.index.categoriesSection.categories.items[0]
        if (!category) notFound()
        const article = category.articles.items[0]
        if (!article) notFound()

        return (
          <Container py="9" mx="auto">
            <Flex direction="row-reverse">
              <TOCRenderer>{article.body?.json.toc}</TOCRenderer>
              <Container maxWidth="700px">
                <Heading as="h1" size="8">
                  {article._title}
                </Heading>
                <Text>{article.excerpt}</Text>
                <Box>
                  <RichText
                    blocks={article.body?.json.blocks}
                    components={{
                      p: (props) => <Text {...props} />,
                      a: (props) => (
                        <Link asChild>
                          <NextLink {...props} />
                        </Link>
                      ),
                      h2: (props) => (
                        <Heading as="h2" size="6" mt="6" mb="2" {...props} />
                      ),
                      h3: (props) => (
                        <Heading as="h3" size="5" mt="6" mb="2" {...props} />
                      ),
                      img: (props) => (
                        <Box asChild my="6" mx="0" width="100%">
                          <figure>
                            <Image
                              {...props}
                              alt={props.alt ?? ''}
                              style={{
                                maxWidth: '100%',
                                height: 'auto',
                                objectFit: 'contain',
                                borderRadius: 'var(--radius-4)',
                              }}
                            />

                            {props.alt && (
                              <Text
                                color="gray"
                                size="1"
                                asChild
                                mx="auto"
                                style={{ width: 'fit-content' }}
                              >
                                <figcaption>{props.alt}</figcaption>
                              </Text>
                            )}
                          </figure>
                        </Box>
                      ),
                      code: ({ isInline, ...rest }) => {
                        if (isInline) {
                          return <Code {...rest} />
                        }
                        return (
                          <pre>
                            <code {...rest} />
                          </pre>
                        )
                      },
                      pre: ({ children }) => children,
                      CalloutComponent: Callout,
                    }}
                  >
                    {article.body?.json.content}
                  </RichText>
                  {!!article.related?.length && (
                    <Fragment>
                      <Heading as="h2" size="6" mt="6" mb="3">
                        Related Articles
                      </Heading>
                      <ArticlesList
                        categorySlug={category._slug}
                        articles={article.related}
                      />
                    </Fragment>
                  )}
                  {/* TODO: Related articles */}
                  <Separator size="4" my="6" />
                  <Card variant="classic" size="3">
                    <Flex gap="2" align="center">
                      <Text style={{ flexGrow: 1 }}>
                        Did this answer your question?
                      </Text>
                      <Button variant="ghost" size="3">
                        😞
                      </Button>
                      <Button variant="ghost" size="3">
                        😐
                      </Button>
                      <Button variant="ghost" size="3">
                        😃
                      </Button>
                    </Flex>
                  </Card>
                </Box>
              </Container>
            </Flex>
          </Container>
        )
      }}
    </Pump>
  )
}
