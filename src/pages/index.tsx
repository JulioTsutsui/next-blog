import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const [loadButtonEnable, setLoadButtonEnable] = useState(
    postsPagination.next_page !== null
  );
  const router = useRouter();

  if (router?.isFallback) {
    return <h1>Carregando...</h1>;
  }

  function loadMorePosts(): void {
    fetch(postsPagination?.next_page)
      .then(res => res.json())
      .then((res: PostPagination) => {
        const formatedPosts = res.results.map(post => {
          return {
            ...post,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            ),
          };
        });

        setNewPosts([...newPosts, ...formatedPosts]);
        setLoadButtonEnable(res.next_page !== null);
      });
  }

  return (
    <>
      <Header />
      <section className={styles.container}>
        {postsPagination.results.map(post => {
          return (
            <article key={post.uid} className={styles.post}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>
                </a>
              </Link>
              <div>
                <time>
                  <FiCalendar />{' '}
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
                <span>
                  <FiUser /> {post.data.author}
                </span>
              </div>
            </article>
          );
        })}

        {newPosts.map(post => {
          return (
            <article key={post.uid} className={styles.post}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>
                </a>
              </Link>
              <div>
                <time>
                  <FiCalendar />{' '}
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
                <span>
                  <FiUser /> {post.data.author}
                </span>
              </div>
            </article>
          );
        })}

        {loadButtonEnable && (
          <button type="button" onClick={loadMorePosts}>
            Carregar mais posts
          </button>
        )}
      </section>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 2,
    }
  );

  const results = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: response.next_page,
        results,
      },
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
