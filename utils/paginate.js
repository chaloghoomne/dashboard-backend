function paginate(page, limit) {
  const pageAsNumber = Number(page);
  const limitAsNumber = Number(limit);

  const pageNumber =
    !isNaN(pageAsNumber) && pageAsNumber > 0 ? pageAsNumber : 1;
  const limitNumber =
    !isNaN(limitAsNumber) && limitAsNumber > 0 ? limitAsNumber : 10;

  const skip = (pageNumber - 1) * limitNumber;
  return { skip, take: limitNumber };
}

module.exports = paginate;
