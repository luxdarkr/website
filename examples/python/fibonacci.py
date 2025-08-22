# Числа Фибоначчи
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Вывод первых 15 чисел
print("Первые 15 чисел Фибоначчи:")
for i in range(15):
    print(f"F({i}) = {fibonacci(i)}")