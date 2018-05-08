local levels = {}

function curr_level()
  return levels[#levels] or 0
end

function Header(elem)
  while elem.level < curr_level() do
    table.remove(levels)
  end
  if elem.level > curr_level() then
    table.insert(levels, elem.level)
  end
  elem.level = #levels
  return elem
end
