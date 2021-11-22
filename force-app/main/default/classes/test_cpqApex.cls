@isTest
public class test_cpqApex {
	
    @isTest
    static void Test_priceBookWrapper(){
        	string label = 'label';
        	string value = 'value';
        pricebookwrapper t = new pricebookwrapper(label, value); 
        	System.assertNotEquals(null, t);
    }
    @isTest
    static void Test_searchProduct(){
        //date for opp
        Date myDate = Date.newInstance(2040, 1, 4);
        //create test customer
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'Test Customer 123456';
        insert cust;
        //product creation
        Id pricebookId = Test.getStandardPricebookId();

        product2 prod = new product2(name ='product', IsActive= True, ProductCode='123', Product_Status__c ='Stock', 
                                    Subcategory__c='Chemicals-Herbicide', Product_Family__c='FMC', Floor_Type__c ='Floor', Floor_Price__c = 100); 
        insert prod; 
        
        product2 prod2= new product2(name ='widget', IsActive= True, ProductCode='321', Product_Status__c ='Stock', 
                                    Subcategory__c='Chemicals-Fungicide', Product_Family__c='FoliarPak', Floor_Type__c ='Floor', Floor_Price__c = 100); 
        insert prod2;
        
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=prod.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
        PricebookEntry pbe2 = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=prod2.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);

        insert pbe;
        insert pbe2;
        
        Test.startTest();
        	List<PricebookEntry> nameOnly = cpqApex.searchProduct('widget', 'All', 'All', pricebookId);
        	List<PricebookEntry> nullName = cpqApex.searchProduct('null', 'Chemicals-Herbicide', 'FMC', priceBookId);
        	List<PricebookEntry> nameandfamily = cpqApex.searchProduct('widget', 'All', 'FoliarPak', priceBookId);
        	List<PricebookEntry> nameandcat = cpqApex.searchProduct('product', 'Chemicals-Herbicide', 'All', priceBookId);
        	List<PricebookEntry> catOnly = cpqApex.searchProduct('null', 'Chemicals-Herbicide', 'All', priceBookId);
        	List<PricebookEntry> famOnly = cpqApex.searchProduct('null', 'All', 'FMC', priceBookId);
        	list<priceBookWrapper> pbw = cpqApex.getPriceBooks();
        Test.stopTest();
    }
    @isTest
    static void Test_getLastPaid(){
                //get record type
        ID recordType = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer').getRecordTypeId();
        Account acct = new Account(); 
        acct.name = '509-Test Comp';
        acct.Customer_Name__c = 'New Company';
        acct.Customer__c = '1010';
        acct.RecordTypeId = recordType;
        insert acct;

        //create product
        Product__c prod = new Product__c(Product_Name__c='Something', Name='123'); 
        insert prod; 

        
        //Create Sales Doc
        Sales_Document__c sd = new Sales_Document__c();
        sd.name = 'test from sf';
        sd.sales_Doc_num__c = '454';
        //get new account recordid
        sd.Customer__c = acct.id;
        sd.Doc_Type__c = 'Invoice';
        
        insert sd; 
        
        Sales_Doc_Detail__c testSale = new Sales_Doc_Detail__c();
        testSale.name = 'Test';
        testSale.sales_document__c = sd.ID;
        testSale.Product__c = prod.ID;
        testSale.Product_Code__c = prod.Name;
        insert testSale;
        
        Test.startTest();
        	Sales_Doc_Detail__c detail = cpqApex.getLastPaid(acct.id, prod.name);
        Test.stopTest();
        system.debug('detail '+detail);
    }
    @isTest
    static void Test_getProducts(){
        //date for opp
        Date myDate = Date.newInstance(2040, 1, 4);
        //create test customer
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'Test Customer 123456';
        insert cust;
        //product creation
        Id pricebookId = Test.getStandardPricebookId();
        
        //create product2 that is active
        product2 prod = new product2(name ='product', IsActive= True); 
        insert prod; 
        
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=prod.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert pbe; 
        
        //create product2 that will be deactivated
        product2 widget = new product2(name ='widget', IsActive= True); 
        insert widget; 
        
        PricebookEntry widgetpbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=widget.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert widgetpbe; 
        //create test opportunity
        opportunity opp = new opportunity(name = 'test name', accountID= cust.id, pricebook2id = pricebookId,
                                         stagename='Estimate(10%)', job_type__c = 'Construction', closedate = myDate);
       
        //insert w/o synced quote
        insert opp; 
       
//opportunitylineitem
        opportunitylineitem li = new opportunitylineitem(opportunityid = opp.id, product2id = prod.Id, PricebookEntryId=pbe.id,
                                                         unitprice= 4, quantity= 3); 
        insert li; 
        opportunitylineitem widgetli = new opportunitylineitem(opportunityid = opp.id, product2id = widget.Id, PricebookEntryId=widgetpbe.id,
                                                         unitprice= 4, quantity= 3); 
        insert widgetli;
        
        Test.startTest();
        	list<OpportunityLineItem> oppLine = cpqApex.getProducts(opp.Id);
        Test.stopTest();
    }
    @isTest
    static void Test_createProducts(){
                //date for opp
        Date myDate = Date.newInstance(2040, 1, 4);
        //create test customer
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'Test Customer 123456';
        insert cust;
        //product creation
        Id pricebookId = Test.getStandardPricebookId();
        
        //create product2 that is active
        product2 prod = new product2(name ='product', IsActive= True); 
        insert prod; 
        
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=prod.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert pbe; 
        
        //create product2 that will be deactivated
        product2 widget = new product2(name ='widget', IsActive= True); 
        insert widget; 
        
        PricebookEntry widgetpbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=widget.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert widgetpbe; 
        //create test opportunity
        opportunity opp = new opportunity(name = 'test name', accountID= cust.id, pricebook2id = pricebookId,
                                         stagename='Estimate(10%)', job_type__c = 'Construction', closedate = myDate);
       
        //insert w/o synced quote
        insert opp; 
        opportunitylineitem li = new opportunitylineitem(opportunityid = opp.id, product2id = prod.Id, PricebookEntryId=pbe.id,
                                                         unitprice= 4, quantity= 3, CPQ_Margin__c = 1); 
        insert li; 
               
        list<OpportunityLineItem> toInsert = new list<OpportunityLineItem>();
        
        OpportunityLineItem existing = new OpportunityLineItem(id = li.id, CPQ_Margin__c = 2, Cost__c =1.05, quantity = 3, unitprice = 4);
        opportunitylineitem newLi = new opportunitylineitem(opportunityid = opp.id, product2id = widget.Id, PricebookEntryId=widgetpbe.id,
                                                         	unitprice= 4, quantity= 3, CPQ_Margin__c = 3, Cost__c = 1.23); 
        toInsert.add(existing);
        toInsert.add(newLi);
        
        Test.startTest();
        	List<OpportunityLineItem> inserted = cpqApex.createProducts(toInsert);
        Test.stopTest(); 
    }  
}