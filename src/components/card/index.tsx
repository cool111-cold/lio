import { Text } from '../text';
import { Tag } from '../tag';
import './style.css';

interface CardProps {
    image?: string;
    title: string;
    description?: string;
    tags?: string[];
    action?: string;
    onClick?: () => void;
}

export const Card = ({image, title, description, tags, action, onClick}: CardProps) => {
    return (
        <div className="card" onClick={onClick}>
            {image && (
                <div className="card-image-wrapper">
                    <img className="card-image" src={image} alt={title} />
                    <div className="card-image-overlay" />
                </div>
            )}
            <div className="card-body">
                <Text size="m">{title}</Text>
                {description && <Text size="xs" color="lightGray">{description}</Text>}
                {tags && tags.length > 0 && (
                    <div className="card-tags">
                        {tags.map((t) => <Tag key={t}>{t}</Tag>)}
                    </div>
                )}
                {action && (
                    <div className="card-action">
                        <Text size="xs">{`${action} →`}</Text>
                    </div>
                )}
            </div>
        </div>
    );
};
