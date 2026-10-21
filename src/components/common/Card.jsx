import PropTypes from 'prop-types';

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export function CardHeader({ children, className = '', title, action }) {
  return (
    <div className={`card-header ${className}`.trim()}>
      {title ? <h3 className="card-title">{title}</h3> : children}
      {action && <div>{action}</div>}
    </div>
  );
}

CardHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  title: PropTypes.node,
  action: PropTypes.node,
};

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`card-body ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

CardBody.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`card-footer ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

CardFooter.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};
