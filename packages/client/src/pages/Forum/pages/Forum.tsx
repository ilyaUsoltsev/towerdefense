import { Helmet } from 'react-helmet';
import { Button } from '@gravity-ui/uikit';
import { ROUTE } from '../../../constants/ROUTE';
import ux from '../main.module.css';
import bodyUx from './Forum.module.css';
import { Link } from 'react-router-dom';
import { ForumTopic, Topic } from '../components/topic';
import { PageHelmet } from '../../../components/PageHelmet';

interface ForumProps {
  topics?: ForumTopic[] | null;
}

export const Forum = ({ topics }: ForumProps) => {
  const searchTopics = (query: string) => {
    document.querySelectorAll(`.${bodyUx.topic}`).forEach(topicEl => {
      topicEl
        .querySelector('h2')!
        .textContent!.trim()
        .toLowerCase()
        .includes(query.trim().toLowerCase())
        ? topicEl.classList.remove(ux.hidden)
        : topicEl.classList.add(ux.hidden);
    });
  };
  return (
    <div className={`${ux.forum} ${ux.flex_col}`}>
      <PageHelmet
        title="Форум"
        description="This is forum. Create, read, and comment on content."
      />

      <div className={ux.blur_layer}></div>

      <header className={`${ux.forum_header} ${ux.flex_row}`}>
        <div className={ux.flex_col}>
          <h1>Военный штаб</h1>
          <h3>Стратегии и обсуждения</h3>
        </div>
        <img
          src="./tower-defence.png"
          alt="forum theme picture"
          className={ux.forum_header_inline_image}
        />

        <Link to={ROUTE.ROOT}>
          <img
            src="/logoBig.png"
            alt="logo - Tower Defence"
            className={ux.forum_header_image}
          />
        </Link>
      </header>

      <div className={`${ux.forum_body}`}>
        <div className={`${ux.body_header} ${ux.flex_row}`}>
          <Link to={ROUTE.FORUM_NEW}>
            <Button view="action" size="l">
              Создать тему
            </Button>
          </Link>
          <input
            type="text"
            placeholder="Поиск по темам..."
            className={ux.topic_search}
            onInput={e => {
              searchTopics((e.target as HTMLInputElement).value);
            }}
          />
        </div>
        <h2>Все темы</h2>

        <div className={`${bodyUx.topics} ${ux.flex_col}`}>
          <Topic
            title="Top maps"
            message="A veryyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy looooooooooooooooooooooooooooooooooooooooooooooooooooooong message yuhoooooooooooooooooooooo"
            lastActivityMinutes={Math.floor(Math.random() * 60)}
          />
          <Topic
            title="Dungeons"
            message="Normal message"
            lastActivityMinutes={Math.floor(Math.random() * 60)}
          />
        </div>
      </div>
    </div>
  );
};
