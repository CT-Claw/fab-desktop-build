import { createStaticStyles } from 'antd-style';

export const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 184px;
    padding: 16px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;
    background: ${cssVar.colorBgContainer};
  `,
  cardGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
  `,
  description: css`
    min-height: 42px;
    color: ${cssVar.colorTextSecondary};
    font-size: 13px;
    line-height: 1.55;
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-block-end: 16px;
  `,
  meta: css`
    color: ${cssVar.colorTextTertiary};
    font-size: 12px;
  `,
  page: css`
    overflow: auto;
    height: 100%;
    padding: 28px;
  `,
  tag: css`
    align-self: flex-start;
    padding: 2px 8px;
    border-radius: 999px;
    color: ${cssVar.colorTextSecondary};
    background: ${cssVar.colorFillTertiary};
    font-size: 12px;
  `,
  title: css`
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  `,
}));
