import React from 'react';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';

const StarRating = ({ rating }) => {
  return (
    <div className="flex text-yellow-500">
      {[...Array(5)].map((_, i) => (
        i < rating ? <AiFillStar key={i} /> : <AiOutlineStar key={i} />
      ))}
    </div>
  );
};

export default StarRating;
