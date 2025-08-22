# Простой калькулятор на Python
def calculator():
    try:
        num1 = float(input("Введите первое число: "))
        operator = input("Введите оператор (+, -, *, /): ")
        num2 = float(input("Введите второе число: "))
        
        if operator == '+':
            result = num1 + num2
        elif operator == '-':
            result = num1 - num2
        elif operator == '*':
            result = num1 * num2
        elif operator == '/':
            if num2 == 0:
                return "Ошибка: деление на ноль!"
            result = num1 / num2
        else:
            return "Неверный оператор!"
        
        return f"Результат: {result}"
    
    except ValueError:
        return "Ошибка: введите числа корректно!"

print(calculator())