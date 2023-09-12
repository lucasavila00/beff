type from = () => "world";
type to = () => string;
type res = to extends from ? true : false;
