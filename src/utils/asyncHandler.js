// wrapping async functions to handle errors
const asyncHandler = (fn) => {

    return  async (req, res, next) => {
        Promise
        .resolve(fn(req, res, next))
        .catch((err)=> next(err));
    };
};

export { asyncHandler };



