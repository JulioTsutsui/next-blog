import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Image from 'next/image';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  return (
    <>
      <Header />
      <div className={styles.banner}>
        <Image src={`${post.data.banner.url}`} alt="banner" layout="fill" />
      </div>
      <main className={styles.container}>
        <div className={styles.info}>
          <h1>{post.data.title}</h1>
          <time>{post.first_publication_date}</time>
          <span>{post.data.author}</span>
          <span>4 min</span>
        </div>
        <div className={styles.content} />
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  /* const prismic = getPrismicClient();
  const posts = await prismic.query(TODO); */
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.last_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(cont => {
        return {
          heading: RichText.asText(cont.heading),
          body: {
            text: RichText.asText(cont.body),
          },
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24,
  };
};
