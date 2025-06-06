create table UserData (
  UserDataId int primary key auto_increment,
  Username varchar(50) unique,
  Email varchar(254) unique,
  PasswordHash varchar(255)
);

create table AccessTokens (
  AccessTokenId int primary key auto_increment,
  TokenValue char(37),
  fk_UserDataId int,
  foreign key (fk_UserDataId) references UserData(UserDataId) on delete cascade
);

create table Chats (
  ChatId int primary key auto_increment,
  ChatName varchar(25),
  SelectedAI varchar(50),
  fk_UserDataId int,
  foreign key (fk_UserDataId) references UserData(UserDataId) on delete cascade
);

create table ChatMessages (
  ChatMessageId int primary key auto_increment,
  Content text,
  Sender enum("user","assistant"),
  fk_ChatId int,
  foreign key (fk_ChatId) references Chats(ChatId) on delete cascade
);