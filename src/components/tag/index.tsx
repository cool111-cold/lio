import './style.css';

export const Tag = ({children}: {children: string}) => {
    return <span className="tag">{children}</span>;
};
