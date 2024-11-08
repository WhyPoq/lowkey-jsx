#include <iostream>
#include <fstream>
#include <exception>
#include <vector>

class NotXjsxError : public std::exception
{
};

class SyntaxError : public std::exception
{
private:
    std::string whatMessage;

public:
    SyntaxError(std::string message)
        : whatMessage("Syntax error: " + message) {}

    const char *what() const throw()
    {
        return whatMessage.c_str();
    }
};

class NotImplementedError : public std::exception
{
private:
    std::string whatMessage;

public:
    NotImplementedError(std::string message)
        : whatMessage("Not implemented: " + message) {}

    const char *what() const throw()
    {
        return whatMessage.c_str();
    }
};

enum NodeType
{
    NT_DEFAULT = 0,
    NT_PROPS,
    NT_TEXT,
    NT_INNERJS,
    NT_COMPONENT,
    NT_XJSX
};

class Node
{
public:
    NodeType type;

    Node(NodeType type)
        : type(type)
    {
    }

    virtual std::string toString()
    {
        throw NotImplementedError("toString method not defined for node");
    }

    virtual ~Node() {}
};

class ComponentChild : public Node
{
public:
    ComponentChild(NodeType type)
        : Node(type)
    {
    }
};

struct Prop
{
    std::string key;
    std::string value;
};

class PropsNode : public Node
{
public:
    std::vector<Prop> propsList;

    PropsNode()
        : Node(NodeType::NT_PROPS)
    {
    }

    std::string toString() override
    {
        std::string output = "";
        for (int i = 0; i < propsList.size(); i++)
        {
            output += " ";
            output += propsList[i].key + "=";
            if (propsList[i].value[0] == '"')
                output += propsList[i].value;
            else
                output += '{' + propsList[i].value + '}';
        }
        return output;
    }
};

class TextNode : public ComponentChild
{
public:
    std::string value;

    TextNode(std::string value) : ComponentChild(NodeType::NT_TEXT), value(value) {}

    std::string toString() override
    {
        return value;
    }
};

class InnerJsNode : public ComponentChild
{
public:
    std::string value;

    InnerJsNode(std::string value) : ComponentChild(NodeType::NT_INNERJS), value(value) {}

    std::string toString() override
    {
        return value;
    }
};

class ComponentNode : public ComponentChild
{
public:
    std::string name;
    PropsNode *props;
    std::vector<ComponentChild *> children;

    ComponentNode(std::string name, PropsNode *props) : ComponentChild(NodeType::NT_COMPONENT), name(name), props(props) {}

    std::string toString() override
    {
        std::string output = "<" + name;
        if (props != nullptr)
            output += props->toString();

        if (children.size() == 0 && 'A' <= name[0] && name[0] <= 'Z')
        {
            output += " />";
            return output;
        }

        output += '>';
        for (int i = 0; i < children.size(); i++)
            output += children[i]->toString();

        output += "</" + name + ">";
        return output;
    }

    ~ComponentNode()
    {
        if (props != nullptr)
            delete props;

        for (int i = 0; i < children.size(); i++)
            delete children[i];
    }
};

struct XjsxPart
{
    std::string jsString;
    ComponentNode *component;
};

class XjsxNode : public Node
{
public:
    std::vector<XjsxPart> parts;

    XjsxNode() : Node(NodeType::NT_XJSX) {}

    std::string toString() override
    {
        std::string output = "";
        for (int i = 0; i < parts.size(); i++)
        {
            output += parts[i].jsString;
            if (parts[i].component != nullptr)
                output += parts[i].component->toString();
        }
        return output;
    }

    ~XjsxNode()
    {
        for (int i = 0; i < parts.size(); i++)
            delete parts[i].component;
    }
};

template <typename T>
class TreeWalker
{
protected:
    T visitNode(Node *node)
    {
        switch (node->type)
        {
        case NodeType::NT_PROPS:
            return visit((PropsNode *)node);
        case NodeType::NT_TEXT:
            return visit((TextNode *)node);
        case NodeType::NT_INNERJS:
            return visit((InnerJsNode *)node);
        case NodeType::NT_COMPONENT:
            return visit((ComponentNode *)node);
        case NodeType::NT_XJSX:
            return visit((XjsxNode *)node);
        }

        throw NotImplementedError("No visit method for node of type " + (int)node->type);
    }

    virtual T visit(PropsNode *node) = 0;
    virtual T visit(TextNode *node) = 0;
    virtual T visit(InnerJsNode *node) = 0;
    virtual T visit(ComponentNode *node) = 0;
    virtual T visit(XjsxNode *node) = 0;
};

class XjsxConverter : public TreeWalker<std::string>
{
private:
    std::string visit(PropsNode *node) override
    {
        std::string res = "{";

        for (int i = 0; i < node->propsList.size(); i++)
        {
            Prop &prop = node->propsList[i];
            res += prop.key + ": ";
            if (prop.key == "ref")
            {
                res += "[\"" + prop.value + "\", els]";
            }
            else
            {
                res += prop.value;
            }

            if (i != node->propsList.size() - 1)
                res += ", ";
        }

        res += "}";
        return res;
    }

    std::string visit(TextNode *node) override
    {
        return "document.createTextNode(`" + node->value + "`)";
    }

    std::string visit(InnerJsNode *node) override
    {
        return node->value;
    }

    std::string visit(ComponentNode *node) override
    {
        std::string res = "";

        res += "Xjsx.create(";

        // if component name starts witj uppercase letter
        std::string &name = node->name;
        if (name.length() > 0 && 'A' <= name[0] && name[0] <= 'Z')
            res += name + ", ";
        else
            res += "\"" + name + "\", ";

        res += visitNode(node->props);

        for (int i = 0; i < node->children.size(); i++)
        {
            res += ", ";
            ComponentChild *child = node->children[i];
            res += visitNode(child);
        }

        res += ")";
        return res;
    }

    std::string visit(XjsxNode *node) override
    {
        std::string res = "";

        for (int i = 0; i < node->parts.size(); i++)
        {
            XjsxPart &xjsxPart = node->parts[i];
            if (xjsxPart.jsString.size() > 0)
                res += xjsxPart.jsString;
            if (xjsxPart.component != nullptr)
                res += visitNode(xjsxPart.component);
        }

        return res;
    }

public:
    std::string xjsxToJs(Node *ast)
    {
        std::string res = visitNode(ast);
        return res;
    }
};

class XjsxParser
{
private:
    std::string &input;

    size_t nextCharPos = 0;
    char curChar = -1;

    size_t curCharPosInLine = 0;
    size_t curLineNum = 1;

public:
    XjsxParser(std::string &input) : input(input) {}

    XjsxNode *parse()
    {
        advance();
        XjsxNode *ast = makeXjsx();
        return ast;
    }

private:
    void
    advance()
    {
        if (nextCharPos == input.length())
        {
            curCharPosInLine++;
            nextCharPos++;
        }

        if (nextCharPos >= input.length())
        {
            curChar = -1;
            return;
        }

        curChar = input[nextCharPos++];

        curCharPosInLine++;
        if (curChar == '\n')
        {
            curCharPosInLine = 0;
            curLineNum++;
        }
    }

    char peek()
    {
        if (nextCharPos < input.length())
            return input[nextCharPos];
        return -1;
    }

    void eatChar(char c)
    {
        if (curChar != c)
        {
            std::string curCharRepr = std::to_string(curChar);
            if (curChar == -1)
            {
                curCharRepr = "EOF";
            }
            throw SyntaxError(std::string("Expected character '") + c + "' at line " + std::to_string(curLineNum) + " position " + std::to_string(curCharPosInLine) + ". But got char '" + curCharRepr + "' instead");
        }
        advance();
    }

    void eatCharJsx(char c)
    {
        if (curChar != c)
            throw NotXjsxError();
        advance();
    }

    bool isLetter(char c)
    {
        return ('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z');
    }

    bool isNumber(char c)
    {
        return '0' <= c && c <= '9';
    }

    bool isBlank(char c)
    {
        return c == ' ' || c == '\t' || c == '\n';
    }

    std::string readWord()
    {
        std::string curWord;
        while (isLetter(curChar) || isNumber(curChar) || curChar == '_')
        {
            curWord += curChar;
            advance();
        }
        return curWord;
    }

    void skipBlank()
    {
        while (isBlank(curChar))
            advance();
    }

    std::string readStr()
    {
        bool escaped = false;
        char quoteChar = curChar;

        std::string res = "";
        res += quoteChar;
        advance();

        while (curChar != -1 && (curChar != quoteChar || escaped))
        {
            escaped = false;
            if (curChar == '\\')
                escaped = true;
            res += curChar;
            advance();
        }

        if (curChar != -1)
        {
            res += quoteChar;
            advance();
        }

        return res;
    }

    std::string readValueInsideCurly()
    {
        int openingCurlyNum = 0;

        std::string res = "";
        while (curChar != -1 && (curChar != '}' || openingCurlyNum > 0))
        {
            // skipping string
            if (curChar == '"' || curChar == '\'' || curChar == '`')
            {
                res += readStr();
            }
            else
            {
                if (curChar == '{')
                    openingCurlyNum++;
                else if (curChar == '}')
                    openingCurlyNum--;
                res += curChar;
                advance();
            }
        }

        return res;
    }

    PropsNode *makeProps()
    {
        PropsNode *props = new PropsNode();
        skipBlank();
        while (curChar != '>' && !(curChar == '/' && peek() == '>'))
        {
            std::string propName = readWord();
            if (propName.size() == 0)
                throw NotXjsxError();

            skipBlank();
            eatChar('=');
            skipBlank();

            std::string propValue = "";
            if (curChar == '{')
            {
                eatChar('{');
                propValue = readValueInsideCurly();
                eatChar('}');
            }
            else
            {
                propValue = readStr();
            }
            props->propsList.push_back({propName, propValue});
            skipBlank();
        }
        return props;
    }

    ComponentNode *makeComponent()
    {
        eatCharJsx('<');

        std::string componentName = readWord();
        if (componentName.size() == 0)
            throw NotXjsxError();

        PropsNode *props = makeProps();
        ComponentNode *component = new ComponentNode(componentName, props);

        // self closing tag
        if (curChar == '/' && peek() == '>')
        {
            eatChar('/');
            eatChar('>');
            return component;
        }

        eatCharJsx('>');

        std::string curText = "";
        while (curChar != -1 && !(curChar == '<' && peek() == '/'))
        {
            if (curChar == '<')
            {
                int nextPosSaved = nextCharPos;
                try
                {
                    ComponentNode *innerComponent = makeComponent();
                    if (curText.size() > 0)
                    {
                        component->children.push_back(new TextNode(curText));
                        curText.clear();
                    }
                    component->children.push_back(innerComponent);
                }
                catch (NotXjsxError &err)
                {
                    nextCharPos = nextPosSaved;
                    curText += '<';
                    advance();
                }
            }
            else if (curChar == '{')
            {
                if (curText.size() > 0)
                {
                    component->children.push_back(new TextNode(curText));
                    curText.clear();
                }

                advance();
                std::string innerStr = readValueInsideCurly();
                advance();
                XjsxParser innerParser(innerStr);
                XjsxNode *innerAst = innerParser.parse();
                XjsxConverter innerConverter;

                std::string innerJs = innerConverter.xjsxToJs(innerAst);
                delete innerAst;
                component->children.push_back(new InnerJsNode(innerJs));
            }
            else
            {
                curText += curChar;
                advance();
            }
        }

        if (curText.size() > 0)
        {
            component->children.push_back(new TextNode(curText));
            curText.clear();
        }

        eatChar('<');
        eatChar('/');

        std::string closingNameName = readWord();
        if (componentName != closingNameName)
            throw SyntaxError(componentName + " element does not have a closing tag at line " + std::to_string(curLineNum) + " position " + std::to_string(curCharPosInLine));

        eatChar('>');

        return component;
    }

    void skipString(std::string &jsString)
    {
        char stringEdgeChar = curChar;
        bool escaped = false;
        jsString += curChar;
        advance();
        while (curChar != -1 && (curChar != stringEdgeChar || escaped))
        {
            escaped = false;
            if (curChar == '\\')
                escaped = true;
            jsString += curChar;
            advance();
        }

        if (curChar != -1)
        {
            jsString += curChar;
            advance();
        }
    }

    void skipSinglelineComment(std::string &jsString)
    {
        jsString += "//";
        advance();
        advance();
        while (curChar != -1 && curChar != '\n')
        {
            jsString += curChar;
            advance();
        }

        if (curChar != -1)
        {
            jsString += curChar;
            advance();
        }
    }

    void skipMultilineComment(std::string &jsString)
    {
        jsString += "/*";
        advance();
        advance();
        while (curChar != -1 && !(curChar == '*' && peek() == '/'))
        {
            jsString += curChar;
            advance();
        }

        if (curChar != -1)
        {
            jsString += "*/";
            advance();
            advance();
        }
    }

    XjsxNode *makeXjsx()
    {
        XjsxNode *xjsx = new XjsxNode();

        while (curChar != -1)
        {
            XjsxPart part;
            part.jsString = "";
            part.component = nullptr;

            while (curChar != -1)
            {
                if (curChar == '\'' || curChar == '"')
                {
                    skipString(part.jsString);
                }
                else if (curChar == '/' && peek() == '/')
                {
                    skipSinglelineComment(part.jsString);
                }
                else if (curChar == '/' && peek() == '*')
                {
                    skipMultilineComment(part.jsString);
                }
                else if (curChar == '<')
                {
                    int nextPosSaved = nextCharPos;
                    try
                    {
                        part.component = makeComponent();
                        break;
                    }
                    catch (NotXjsxError &err)
                    {
                        part.jsString += '<';
                        nextCharPos = nextPosSaved;
                        advance();
                    }
                }
                else
                {
                    part.jsString += curChar;
                    advance();
                }
            }
            xjsx->parts.push_back(part);
        }

        return xjsx;
    }
};

void compileFile(char *source, char *dist)
{
    std::ifstream inputFile(source);
    std::string input = std::string(std::istreambuf_iterator<char>(inputFile), std::istreambuf_iterator<char>());
    inputFile.close();

    XjsxParser parser(input);
    XjsxNode *ast = parser.parse();
    XjsxConverter converter;

    std::string res = converter.xjsxToJs(ast);

    std::ofstream outputFile;
    outputFile.open(dist);
    outputFile << res;
    outputFile.close();

    delete ast;
}

int main(int argc, char *argv[])
{
    int expectedArgCount = 3;
    if (argc != expectedArgCount)
    {
        std::cout << "Error: ";
        if (argc < expectedArgCount)
            std::cout
                << "Too few arguments\n";
        if (argc > expectedArgCount)
            std::cout << "Too many arguments\n";

        std::cout << "Usage:\n";
        std::cout << "  ./compiler sourcePath outPath\n";

        return 1;
    }

    compileFile(argv[1], argv[2]);

    return 0;
}
