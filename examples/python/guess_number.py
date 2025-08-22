# Игра "Угадай число"
import random

def guess_number():
    number = random.randint(1, 100)
    attempts = 0
    
    print("Я загадал число от 1 до 100!")
    print("Попробуй угадать!")
    
    while True:
        try:
            guess = int(input("Твоя догадка: "))
            attempts += 1
            
            if guess < number:
                print("Слишком маленькое!")
            elif guess > number:
                print("Слишком большое!")
            else:
                print(f"Поздравляю! Ты угадал за {attempts} попыток!")
                break
                
        except ValueError:
            print("Пожалуйста, введите число!")

guess_number()