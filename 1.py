ls = [[0 for i in range(10) ] for j in range(10)]

x, y = 0, 0

for i in range(-1, 1 + 1):
    for j in range(-1, 1 + 1):
        if ls[y + i][x + j] == ".":
            ls[y + i][x + j] = 1

# ls[y - 1][x - 1] = 1
# ls[y - 1][x] = 1
# ls[y - 1][x + 1] = 1
# ls[y][x - 1] = 1
# ls[y][x] = 1
# ls[y][x + 1] = 1
# ls[y + 1][x - 1] = 1
# ls[y + 1][x] = 1
# ls[y + 1][x + 1] = 1



for i in ls:
    print(*i)