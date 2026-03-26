from services.password_generator import generate_password

while True:
    print("Введите команду")
    str1=input()
    if str1=="exit":
        break
    elif str1=="generate":
        print("Введите длину пароля от 8 до 32 символов")
        len1=int(input())
        print("Будете ли вы использовать строчные символы?")
        str2=input()
        if str2=="Да" or str2=="да":
            lower=True
        else:
            lower=False
        print("Будете ли вы использовать прописные символы?")
        str3=input()
        if str3=="Да" or str3=="да":
            upper=True
        else:
            upper=False
        print("Будете ли вы использовать цифры")
        str4=input()
        if str4=="Да" or str4=="да":
            digits=True
        else:
            digits=False
        print("Будете ли вы использовать специальные символы?")
        str5=input()
        if str5=="Да" or str5=="да":
            special=True
        else:
            special=False
        print(generate_password(len1,lower,upper,digits,special,100))
    else:
        print('Введена несуществующая команда')