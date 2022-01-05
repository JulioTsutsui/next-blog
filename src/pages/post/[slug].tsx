import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';

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
  const router = useRouter();

  if (router?.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Header />
      <div className={styles.banner}>
        <Image src={`${post?.data.banner.url}`} alt="banner" layout="fill" />
      </div>
      <main className={styles.container}>
        <h1>{post?.data.title}</h1>
        <div className={styles.info}>
          <time>
            <FiCalendar />{' '}
            {format(new Date(post?.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </time>
          <span>
            <FiUser /> {post?.data.author}
          </span>
          <span>
            <FiClock /> 4 min
          </span>
        </div>
        <div className={styles.content}>
          {post?.data.content.map(content => {
            return [
              <h2>{content?.heading}</h2>,
              content.body.map(body => {
                return <p>{body?.text}</p>;
              }),
            ];
          })}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    Prismic.predicates.any('document.type', ['post'])
  );

  const paths = response.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(cont => {
        return {
          heading: cont.heading.text,
          body: cont.body,
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
