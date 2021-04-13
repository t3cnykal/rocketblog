import { GetStaticPaths, GetStaticPathsContext, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    subtitle: string;
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

export default function Post({ post }: PostProps) {
  const router = useRouter();
  if (router.isFallback) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.loading}><p>Carregando...</p></div>
      </div>
    )
  }
  return (
    <div className={styles.container}>
      <Header />
      {!post && <h3>Carregando...</h3>}
      {post && (
        <>
          <img className={styles.banner} src={post.data.banner.url} alt="Post banner" />
          <div className={styles.post}>
            <h1>{post.data.title}</h1>
            <div className={styles.info}>
              <FiCalendar size={20} />
              <p>{format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</p>
              <FiUser size={20} />
              <p>{post.data.author}</p>
              <FiClock size={20} />
              <p>4 min</p>
            </div>
            <div className={styles.postContent}>
              {post.data.content.map((content, index) => (
                <div key={index}>
                  <h2>{content.heading}</h2>
                  <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>

  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ]);
  const paths = posts.results.map(post => ({
    params: { slug: post.uid }
  }))
  return {
    fallback: true,
    paths
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const uid = params.slug;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(uid), {});
  await setTimeout(() => {}, 2000)
  const post: Post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    }
  }

  return {
    props: { post }
  }
};
